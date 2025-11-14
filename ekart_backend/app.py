from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required,
    get_jwt_identity, get_jwt
)
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta, datetime
from sqlalchemy import text

app = Flask(__name__)


app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+mysqlconnector://root:MYSQL@localhost/ekart_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


app.config['JWT_SECRET_KEY'] = 'super-secret-key'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

db = SQLAlchemy(app)
jwt = JWTManager(app)


class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('customer', 'admin'), nullable=False, default='customer')
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Product(db.Model):
    __tablename__ = 'products'
    product_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    inventory = db.Column(db.Integer, nullable=False)


class ProductMeta(db.Model):
    __tablename__ = 'product_meta'
    product_id = db.Column(db.Integer, db.ForeignKey('products.product_id'), primary_key=True)
    image_url = db.Column(db.Text, nullable=True)
    rating = db.Column(db.Float, nullable=False, default=0.0)
    popularity = db.Column(db.Integer, nullable=False, default=0)


class Category(db.Model):
    __tablename__ = 'categories'
    category_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True, nullable=False)


class ProductCategory(db.Model):
    __tablename__ = 'product_categories'
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.product_id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.category_id'), nullable=False)


class Order(db.Model):
    __tablename__ = 'orders'
    order_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    status = db.Column(db.Enum('pending', 'paid', 'shipped', 'delivered', 'cancelled'), nullable=False, default='pending')
    total = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class OrderItem(db.Model):
    __tablename__ = 'order_items'
    order_item_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.order_id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.product_id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    price_at_purchase = db.Column(db.Numeric(10, 2), nullable=False)


init_done = False

@app.before_request
def initialize_database():
    global init_done
    if init_done:
        return
    try:
        with app.app_context():
            db.create_all()
           
            try:
                db.session.execute(text("ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1"))
                db.session.commit()
            except Exception:
                db.session.rollback()
           
            try:
                db.session.execute(text("ALTER TABLE product_meta ADD COLUMN rating_count INT NOT NULL DEFAULT 0"))
                db.session.commit()
            except Exception:
                db.session.rollback()
        init_done = True
    except Exception as e:
        app.logger.error(f'DB init failed: {e}')


class Cart(db.Model):
    __tablename__ = 'cart'
    cart_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.product_id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)

    user = db.relationship('User', backref='cart_items')
    product = db.relationship('Product')


@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data.get('username') or not data.get('password'):
        return jsonify({'msg': 'Username and password required'}), 400
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'msg': 'Username already exists'}), 400
    user = User(username=data['username'], role='customer')
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    return jsonify({'msg': 'User registered successfully'}), 201


@app.route('/api/admin/register', methods=['POST'])
def admin_register():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'msg': 'Username and password required'}), 400
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'msg': 'Username already exists'}), 400
    user = User(username=data['username'], role='admin')
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    return jsonify({'msg': 'Admin registered successfully'}), 201


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'msg': 'Username and password required'}), 400
    user = User.query.filter_by(username=data['username']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({'msg': 'Invalid username or password'}), 401
    if not user.is_active:
        return jsonify({'msg': 'Account is deactivated'}), 403
    additional_claims = {'username': user.username, 'role': user.role}
    access_token = create_access_token(identity=str(user.user_id), additional_claims=additional_claims)
    return jsonify(access_token=access_token)


@app.route('/api/profile', methods=['GET'])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    claims = get_jwt()
    return jsonify({
        'user_id': user_id,
        'username': claims.get('username'),
        'role': claims.get('role')
    })


@app.route('/api/account/deactivate', methods=['POST'])
@jwt_required()
def deactivate_account():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    user.is_active = False
    db.session.commit()
    return jsonify({'msg': 'Account deactivated. Data retained.'})


@app.route('/ping', methods=['GET'])
def ping():
    return 'pong'


@app.route('/health', methods=['GET'])
def health():
    status = {'status': 'ok', 'database': 'unknown'}
    try:
        db.session.execute(text('SELECT 1'))
        status['database'] = 'up'
    except Exception as e:
        status['status'] = 'degraded'
        status['database'] = f'error: {str(e)}'
    return jsonify(status)


@app.route('/api/products', methods=['GET'])
def get_products():
    q = request.args.get('q', type=str, default=None)
    category_id = request.args.get('category_id', type=int, default=None)
    page = request.args.get('page', type=int, default=1)
    page_size = request.args.get('page_size', type=int, default=12)
    sort = request.args.get('sort', type=str, default=None)  

    base_query = Product.query

    if q:
        like = f"%{q}%"
        base_query = base_query.filter(db.or_(Product.name.ilike(like), Product.description.ilike(like)))

    if category_id:
        base_query = base_query.join(ProductCategory, ProductCategory.product_id == Product.product_id) \
                               .filter(ProductCategory.category_id == category_id)

    total = base_query.count()

    
    query = base_query.outerjoin(ProductMeta, ProductMeta.product_id == Product.product_id)

    if sort == 'price_asc':
        query = query.order_by(Product.price.asc())
    elif sort == 'price_desc':
        query = query.order_by(Product.price.desc())
    elif sort == 'rating':
        query = query.order_by(db.func.coalesce(ProductMeta.rating, 0).desc())
    elif sort == 'popularity':
        query = query.order_by(db.func.coalesce(ProductMeta.popularity, 0).desc())

    rows = query.add_columns(ProductMeta.image_url, ProductMeta.rating, ProductMeta.popularity) \
               .offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for p, image_url, rating, popularity in rows:
        items.append({
            'product_id': p.product_id,
            'name': p.name,
            'description': p.description,
            'price': float(p.price),
            'inventory': p.inventory,
            'image_url': image_url,
            'rating': float(rating or 0),
            'popularity': int(popularity or 0)
        })

    return jsonify({'items': items, 'total': total, 'page': page, 'page_size': page_size})


@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product_detail(product_id):
    p = Product.query.get_or_404(product_id)
    meta = ProductMeta.query.filter_by(product_id=product_id).first()
    return jsonify({'product': {
        'product_id': p.product_id,
        'name': p.name,
        'description': p.description,
        'price': float(p.price),
        'inventory': p.inventory,
        'image_url': meta.image_url if meta else None,
        'rating': float(meta.rating) if meta else 0.0,
        'popularity': int(meta.popularity) if meta else 0
    }})


@app.route('/api/products/<int:product_id>/rate', methods=['POST'])
@jwt_required()
def rate_product(product_id):
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json() or {}
        rating_val = int(data.get('rating', 0))
        if rating_val < 1 or rating_val > 5:
            return jsonify({'msg': 'Rating must be between 1 and 5'}), 400

        p = Product.query.get(product_id)
        if not p:
            return jsonify({'msg': 'Product not found'}), 404

        meta = ProductMeta.query.filter_by(product_id=product_id).first()
        if not meta:
            meta = ProductMeta(product_id=product_id, image_url=None, rating=0.0, popularity=0)
            db.session.add(meta)
            db.session.flush()

        
        rating_count = 0
        try:
            rating_count = int(getattr(meta, 'rating_count'))
        except Exception:
           
            try:
                row = db.session.execute(text('SELECT rating_count FROM product_meta WHERE product_id = :pid'), {'pid': product_id}).fetchone()
                rating_count = int(row[0]) if row and row[0] is not None else 0
            except Exception:
                rating_count = 0

        new_count = rating_count + 1
        new_avg = ((float(meta.rating or 0.0) * rating_count) + rating_val) / new_count
        
        try:
            meta.rating = float(new_avg)
            setattr(meta, 'rating_count', new_count)
        except Exception:
           
            db.session.execute(text('UPDATE product_meta SET rating = :r, rating_count = :c WHERE product_id = :pid'),
                               { 'r': float(new_avg), 'c': new_count, 'pid': product_id })

        db.session.commit()
        return jsonify({'msg': 'Thank you for rating!', 'rating': float(new_avg), 'rating_count': int(new_count)})
    except Exception as e:
        db.session.rollback()
        app.logger.exception(f"/api/products/{product_id}/rate failed: {e}")
        return jsonify({'msg': 'Failed to submit rating', 'error': str(e)}), 500


@app.route('/api/categories', methods=['GET'])
def get_categories():
    cats = Category.query.order_by(Category.name.asc()).all()
    return jsonify([{'category_id': c.category_id, 'name': c.name} for c in cats])


@app.route('/api/cart', methods=['GET'])
@jwt_required()
def get_cart():
    user_id = int(get_jwt_identity())
    cart_items = Cart.query.filter_by(user_id=user_id).all()
    result = []
    for item in cart_items:
        product = Product.query.get(item.product_id)
        if product:
            result.append({
                'product_id': item.product_id,
                'name': product.name,
                'description': product.description,
                'price': float(product.price),
                'quantity': item.quantity
            })
    return jsonify(result)


@app.route('/api/admin/metrics', methods=['GET'])
@jwt_required()
def admin_metrics():
    try:
        claims = get_jwt()
        role = claims.get('role')
        if role != 'admin':
            return jsonify({'msg': 'Admin privilege required'}), 403

       
        total_users = db.session.query(db.func.count(User.user_id)).scalar() or 0
        active_users = db.session.query(db.func.count(User.user_id)).filter(User.is_active == True).scalar() or 0
        inactive_users = int(total_users) - int(active_users)

       
        total_orders = db.session.query(db.func.count(Order.order_id)).scalar() or 0
        try:
            revenue_total = (
                db.session.query(
                    db.func.coalesce(db.func.sum(OrderItem.price_at_purchase * OrderItem.quantity), 0)
                )
                .select_from(OrderItem)
                .join(Order, OrderItem.order_id == Order.order_id)
                .filter(Order.status.in_(['paid', 'shipped', 'delivered']))
                .scalar() or 0
            )
        except Exception:
            
            revenue_total = (
                db.session.query(
                    db.func.coalesce(db.func.sum(Product.price * OrderItem.quantity), 0)
                )
                .select_from(OrderItem)
                .join(Order, OrderItem.order_id == Order.order_id)
                .join(Product, OrderItem.product_id == Product.product_id)
                .filter(Order.status.in_(['paid', 'shipped', 'delivered']))
                .scalar() or 0
            )

       
        status_counts = dict(
            (s, 0) for s in ['pending', 'paid', 'shipped', 'delivered', 'cancelled']
        )
        rows = db.session.query(Order.status, db.func.count(Order.order_id)).group_by(Order.status).all()
        for st, cnt in rows:
            status_counts[st] = int(cnt)

        
        top_rows = (
            db.session.query(OrderItem.product_id, db.func.sum(OrderItem.quantity).label('qty'))
            .group_by(OrderItem.product_id)
            .order_by(db.desc('qty'))
            .limit(5)
            .all()
        )
        top_products = []
        for pid, qty in top_rows:
            p = Product.query.get(pid)
            top_products.append({'product_id': pid, 'name': p.name if p else f'#{pid}', 'quantity_sold': int(qty)})

        return jsonify({
            'users': {
                'total': int(total_users),
                'active': int(active_users),
                'inactive': int(inactive_users),
            },
            'orders': {
                'total': int(total_orders),
                'revenue_total': float(revenue_total),
                'by_status': status_counts,
            },
            'top_products': top_products,
        })
    except Exception as e:
        app.logger.exception(f"/api/admin/metrics failed: {e}")
        return jsonify({'msg': 'Internal Server Error', 'error': str(e)}), 500


@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
def admin_users_list():
    """List users; optional ?active=true|false to filter by active state."""
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'msg': 'Admin privilege required'}), 403
        active_param = request.args.get('active')
        q = User.query
        if active_param is not None:
            val = active_param.lower() in ['1', 'true', 'yes']
            q = q.filter(User.is_active == val)
        users = q.order_by(User.user_id.asc()).all()
        data = [
            {
                'user_id': u.user_id,
                'username': u.username,
                'role': u.role,
                'is_active': bool(u.is_active),
            }
            for u in users
        ]
        return jsonify({'items': data, 'count': len(data)})
    except Exception as e:
        app.logger.exception(f"/api/admin/users failed: {e}")
        return jsonify({'msg': 'Internal Server Error', 'error': str(e)}), 500

@app.route('/api/admin/analytics', methods=['GET'])
@jwt_required()
def admin_analytics():
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'msg': 'Admin privilege required'}), 403

        
        from_str = request.args.get('from')
        to_str = request.args.get('to')
        try:
            start = datetime.fromisoformat(from_str) if from_str else None
        except Exception:
            return jsonify({'msg': 'Invalid from date'}), 400
        try:
            end = datetime.fromisoformat(to_str) if to_str else None
        except Exception:
            return jsonify({'msg': 'Invalid to date'}), 400

        q = db.session.query(Order)
        if start:
            q = q.filter(Order.created_at >= start)
        if end:
            q = q.filter(Order.created_at <= end)

        
        try:
            sales_q = (
                db.session.query(db.func.coalesce(db.func.sum(OrderItem.price_at_purchase * OrderItem.quantity), 0))
                .select_from(OrderItem)
                .join(Order, OrderItem.order_id == Order.order_id)
                .filter(Order.status.in_(['paid', 'shipped', 'delivered']))
            )
        except Exception:
            sales_q = (
                db.session.query(db.func.coalesce(db.func.sum(Product.price * OrderItem.quantity), 0))
                .select_from(OrderItem)
                .join(Order, OrderItem.order_id == Order.order_id)
                .join(Product, OrderItem.product_id == Product.product_id)
                .filter(Order.status.in_(['paid', 'shipped', 'delivered']))
            )
        if start:
            sales_q = sales_q.filter(Order.created_at >= start)
        if end:
            sales_q = sales_q.filter(Order.created_at <= end)
        total_sales = sales_q.scalar() or 0

       
        ym = db.func.date_format(Order.created_at, '%Y-%m')
        try:
            monthly_rows = (
                db.session.query(ym.label('month'), db.func.coalesce(db.func.sum(OrderItem.price_at_purchase * OrderItem.quantity), 0))
                .select_from(OrderItem)
                .join(Order, OrderItem.order_id == Order.order_id)
                .filter(Order.status.in_(['paid', 'shipped', 'delivered']))
            )
        except Exception:
            monthly_rows = (
                db.session.query(ym.label('month'), db.func.coalesce(db.func.sum(Product.price * OrderItem.quantity), 0))
                .select_from(OrderItem)
                .join(Order, OrderItem.order_id == Order.order_id)
                .join(Product, OrderItem.product_id == Product.product_id)
                .filter(Order.status.in_(['paid', 'shipped', 'delivered']))
            )
        if start:
            monthly_rows = monthly_rows.filter(Order.created_at >= start)
        if end:
            monthly_rows = monthly_rows.filter(Order.created_at <= end)
        monthly_rows = monthly_rows.group_by('month').order_by('month').all()
        monthly = [{'month': m, 'sales': float(s)} for m, s in monthly_rows]

        
        ymd = db.func.date_format(Order.created_at, '%Y-%m-%d')
        try:
            daily_rows = (
                db.session.query(ymd.label('date'), db.func.coalesce(db.func.sum(OrderItem.price_at_purchase * OrderItem.quantity), 0))
                .select_from(OrderItem)
                .join(Order, OrderItem.order_id == Order.order_id)
                .filter(Order.status.in_(['paid', 'shipped', 'delivered']))
            )
        except Exception:
            daily_rows = (
                db.session.query(ymd.label('date'), db.func.coalesce(db.func.sum(Product.price * OrderItem.quantity), 0))
                .select_from(OrderItem)
                .join(Order, OrderItem.order_id == Order.order_id)
                .join(Product, OrderItem.product_id == Product.product_id)
                .filter(Order.status.in_(['paid', 'shipped', 'delivered']))
            )
        if start:
            daily_rows = daily_rows.filter(Order.created_at >= start)
        if end:
            daily_rows = daily_rows.filter(Order.created_at <= end)
        daily_rows = daily_rows.group_by('date').order_by('date').all()
        daily = [{'date': d, 'sales': float(s)} for d, s in daily_rows]

        return jsonify({
            'total_sales': float(total_sales),
            'monthly': monthly,
            'daily': daily,
            'range': {
                'from': from_str,
                'to': to_str
            }
        })
    except Exception as e:
        app.logger.exception(f"/api/admin/analytics failed: {e}")
        return jsonify({'msg': 'Internal Server Error', 'error': str(e)}), 500


@app.route('/api/admin/transactions', methods=['GET'])
@jwt_required()
def admin_transactions():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'msg': 'Admin privilege required'}), 403

    page = request.args.get('page', type=int, default=1)
    page_size = request.args.get('page_size', type=int, default=20)
    from_str = request.args.get('from')
    to_str = request.args.get('to')
    try:
        start = datetime.fromisoformat(from_str) if from_str else None
    except Exception:
        return jsonify({'msg': 'Invalid from date'}), 400
    try:
        end = datetime.fromisoformat(to_str) if to_str else None
    except Exception:
        return jsonify({'msg': 'Invalid to date'}), 400

    q = db.session.query(Order)
    if start:
        q = q.filter(Order.created_at >= start)
    if end:
        q = q.filter(Order.created_at <= end)
    total = q.count()
   
    rows = (
        q.order_by(Order.created_at.desc())
         .offset((page-1)*page_size)
         .limit(page_size)
         .all()
    )
    
    uids = list({o.user_id for o in rows})
    users = {}
    if uids:
        for u in db.session.query(User).filter(User.user_id.in_(uids)).all():
            users[u.user_id] = u.username
    items = [{
        'order_id': o.order_id,
        'user_id': o.user_id,
        'username': users.get(o.user_id),
        'status': o.status,
        'total': float(getattr(o, 'total', 0) or 0),
        'created_at': o.created_at.isoformat(),
    } for o in rows]
    return jsonify({'items': items, 'total': total, 'page': page, 'page_size': page_size})


@app.route('/api/admin/transactions/<int:order_id>', methods=['GET'])
@jwt_required()
def admin_transaction_detail(order_id):
    try:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'msg': 'Admin privilege required'}), 403
        o = Order.query.get_or_404(order_id)
        u = User.query.get(o.user_id)
        lines = []
        subtotal = 0.0

        try:
            items = OrderItem.query.filter_by(order_id=o.order_id).all()
            for it in items:
                p = Product.query.get(it.product_id)
                try:
                    unit_price = float(getattr(it, 'price_at_purchase'))
                except Exception:
                    unit_price = float(p.price) if p else 0.0
                line_total = unit_price * it.quantity
                subtotal += line_total
                lines.append({
                    'product_id': it.product_id,
                    'product_name': p.name if p else f'#{it.product_id}',
                    'quantity': it.quantity,
                    'unit_price': unit_price,
                    'line_total': line_total,
                })
        except Exception:
           
            rows = db.session.execute(
                text("SELECT product_id, quantity, price_at_purchase FROM order_items WHERE order_id = :oid"),
                { 'oid': o.order_id }
            ).fetchall()
            for r in rows:
                pid = int(r[0])
                qty = int(r[1] or 0)
                price_val = r[2] if r[2] is not None else (
                    db.session.query(Product.price).filter(Product.product_id == pid).scalar() or 0
                )
                unit_price = float(price_val)
                line_total = unit_price * qty
                subtotal += line_total
                pname = db.session.query(Product.name).filter(Product.product_id == pid).scalar()
                lines.append({
                    'product_id': pid,
                    'product_name': pname or f'#{pid}',
                    'quantity': qty,
                    'unit_price': unit_price,
                    'line_total': line_total,
                })

        created_at_str = (
            o.created_at.isoformat() if getattr(o, 'created_at', None) else datetime.utcnow().isoformat()
        )
        return jsonify({
            'order_id': o.order_id,
            'user': {'user_id': o.user_id, 'username': u.username if u else None},
            'status': o.status,
            'created_at': created_at_str,
            'subtotal': float(subtotal),
            'lines': lines,
        })
    except Exception as e:
        app.logger.exception(f"/api/admin/transactions/{order_id} failed: {e}")
        return jsonify({'msg': 'Failed to load order detail', 'error': str(e)}), 500


@app.route('/api/cart', methods=['POST'])
@jwt_required()
def add_to_cart():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data:
        return jsonify({'msg': 'Missing JSON data'}), 400

    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)

    if not product_id or quantity < 1:
        return jsonify({'msg': 'Invalid product or quantity'}), 400

    product = Product.query.get(product_id)
    if not product:
        return jsonify({'msg': 'Product not found'}), 404

    cart_item = Cart.query.filter_by(user_id=user_id, product_id=product_id).first()
    new_qty = quantity + (cart_item.quantity if cart_item else 0)
    if new_qty > product.inventory:
        return jsonify({'msg': f'Only {product.inventory} units available'}), 400
    if cart_item:
        cart_item.quantity = new_qty
    else:
        cart_item = Cart(user_id=user_id, product_id=product_id, quantity=quantity)
        db.session.add(cart_item)
    db.session.commit()
    return jsonify({'msg': 'Product added to cart'}), 200


@app.route('/api/cart', methods=['PUT'])
@jwt_required()
def update_cart_item():
    user_id = int(get_jwt_identity())
    data = request.get_json()
    if not data:
        return jsonify({'msg': 'Missing JSON data'}), 400

    product_id = data.get('product_id')
    quantity = data.get('quantity')

    if not product_id or quantity is None or quantity < 0:
        return jsonify({'msg': 'Invalid product or quantity'}), 400

    cart_item = Cart.query.filter_by(user_id=user_id, product_id=product_id).first()
    if not cart_item:
        return jsonify({'msg': 'Cart item not found'}), 404

    if quantity == 0:
        db.session.delete(cart_item)
    else:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'msg': 'Product not found'}), 404
        if quantity > product.inventory:
            return jsonify({'msg': f'Only {product.inventory} units available'}), 400
        cart_item.quantity = quantity
    db.session.commit()
    return jsonify({'msg': 'Cart updated'}), 200


@app.route('/api/cart/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_cart_item(product_id):
    user_id = int(get_jwt_identity())
    cart_item = Cart.query.filter_by(user_id=user_id, product_id=product_id).first()
    if not cart_item:
        return jsonify({'msg': 'Cart item not found'}), 404
    db.session.delete(cart_item)
    db.session.commit()
    return jsonify({'msg': 'Cart item removed'}), 200


@app.route('/api/admin/products/<int:product_id>/inventory', methods=['PATCH'])
@jwt_required()
def admin_update_inventory(product_id):
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'msg': 'Admin privilege required'}), 403
    data = request.get_json() or {}
    try:
        new_inventory = int(data.get('inventory'))
        if new_inventory < 0:
            raise ValueError('inventory cannot be negative')
    except Exception:
        return jsonify({'msg': 'Invalid inventory value'}), 400
    p = Product.query.get_or_404(product_id)
    p.inventory = new_inventory
    db.session.commit()
    return jsonify({'msg': 'Inventory updated', 'product_id': p.product_id, 'inventory': p.inventory})


@app.route('/api/admin/products', methods=['POST'])
@jwt_required()
def admin_create_product():
    """Create a new product. Body: { name, description, price, inventory, image_url? }"""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'msg': 'Admin privilege required'}), 403
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    description = data.get('description') or ''
    price = data.get('price')
    inventory = data.get('inventory')
    image_url = data.get('image_url')
    if not name:
        return jsonify({'msg': 'Name is required'}), 400
    try:
        price_val = float(price)
        if price_val < 0:
            raise ValueError()
    except Exception:
        return jsonify({'msg': 'Invalid price'}), 400
    try:
        inv_val = int(inventory)
        if inv_val < 0:
            raise ValueError()
    except Exception:
        return jsonify({'msg': 'Invalid inventory'}), 400
    try:
        p = Product(name=name, description=description, price=price_val, inventory=inv_val)
        db.session.add(p)
        db.session.flush()
        # optional meta
        if image_url:
            meta = ProductMeta(product_id=p.product_id, image_url=image_url, rating=0.0, popularity=0)
            db.session.add(meta)
        db.session.commit()
        return jsonify({'msg': 'Product created', 'product_id': p.product_id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'msg': 'Failed to create product', 'error': str(e)}), 500


@app.route('/api/orders', methods=['POST'])
@jwt_required()
def place_order():
    user_id = int(get_jwt_identity())
    cart_items = Cart.query.filter_by(user_id=user_id).all()
    if not cart_items:
        return jsonify({'msg': 'Cart is empty'}), 400

    total = 0
    product_map = {}
    for item in cart_items:
        product = Product.query.get(item.product_id)
        if not product:
            return jsonify({'msg': f'Product {item.product_id} not found'}), 400
        if product.inventory < item.quantity:
            return jsonify({'msg': f'Insufficient inventory for product {product.name}'}), 400
        total += float(product.price) * item.quantity
        product_map[item.product_id] = product

    order = Order(user_id=user_id, status='paid', total=total)
    db.session.add(order)
    db.session.flush()

    for item in cart_items:
        product = product_map[item.product_id]
        db.session.add(OrderItem(
            order_id=order.order_id,
            product_id=product.product_id,
            quantity=item.quantity,
            price_at_purchase=product.price
        ))
        product.inventory -= item.quantity

    Cart.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    return jsonify({'msg': 'Order placed successfully', 'order_id': order.order_id, 'status': order.status, 'total': total}), 201


@app.route('/api/orders', methods=['GET'])
@jwt_required()
def list_orders():
    user_id = int(get_jwt_identity())
    orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
    result = []
    for o in orders:
        result.append({
            'order_id': o.order_id,
            'status': o.status,
            'total': float(o.total),
            'created_at': o.created_at.isoformat()
        })
    return jsonify(result)


@app.route('/api/orders/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    try:
        user_id = int(get_jwt_identity())
        order = Order.query.get_or_404(order_id)
        if order.user_id != user_id:
            return jsonify({'msg': 'Forbidden'}), 403
        safe_items = []
        try:
            items = OrderItem.query.filter_by(order_id=order.order_id).all()
            for it in items:
                price_val = it.price_at_purchase
                if price_val is None:
                    price_val = db.session.query(Product.price).filter(Product.product_id == it.product_id).scalar() or 0
                safe_items.append({
                    'product_id': it.product_id,
                    'quantity': it.quantity,
                    'price_at_purchase': float(price_val)
                })
        except Exception:
            
            rows = db.session.execute(
                text("SELECT product_id, quantity, price_at_purchase FROM order_items WHERE order_id = :oid"),
                { 'oid': order.order_id }
            ).fetchall()
            for r in rows:
                pid = r[0]
                qty = int(r[1] or 0)
                price_val = r[2] if r[2] is not None else (
                    db.session.query(Product.price).filter(Product.product_id == pid).scalar() or 0
                )
                safe_items.append({
                    'product_id': pid,
                    'quantity': qty,
                    'price_at_purchase': float(price_val)
                })
        created_at_str = order.created_at.isoformat() if getattr(order, 'created_at', None) else datetime.utcnow().isoformat()
        return jsonify({
            'order_id': order.order_id,
            'status': order.status,
            'total': float(order.total or 0),
            'created_at': created_at_str,
            'items': safe_items
        })
    except Exception as e:
        app.logger.exception(f"/api/orders/{order_id} failed: {e}")
        return jsonify({'msg': 'Internal Server Error', 'error': str(e)}), 500


@app.route('/api/orders/<int:order_id>/status', methods=['PATCH'])
@jwt_required()
def update_order_status(order_id):
    claims = get_jwt()
    role = claims.get('role')
    if role != 'admin':
        return jsonify({'msg': 'Admin privilege required'}), 403
    data = request.get_json() or {}
    status = data.get('status')
    if status not in ['pending', 'paid', 'shipped', 'delivered', 'cancelled']:
        return jsonify({'msg': 'Invalid status'}), 400
    order = Order.query.get_or_404(order_id)
    order.status = status
    db.session.commit()
    return jsonify({'msg': 'Status updated', 'order_id': order.order_id, 'status': order.status})


@app.route('/api/orders/<int:order_id>/pay', methods=['POST'])
@jwt_required()
def simulate_payment(order_id):
    user_id = int(get_jwt_identity())
    order = Order.query.get_or_404(order_id)
    if order.user_id != user_id:
        return jsonify({'msg': 'Forbidden'}), 403
    if order.status != 'pending':
        return jsonify({'msg': 'Order not in pending state'}), 400
    order.status = 'paid'
    db.session.commit()
    return jsonify({'msg': 'Payment successful', 'order_id': order.order_id, 'status': order.status})


if __name__ == '__main__':
    app.run(debug=True)

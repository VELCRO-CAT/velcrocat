exports.up = async function(knex) {
  await knex.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.string('name').notNullable();
    t.string('email').notNullable().unique();
    t.string('password').notNullable();
    t.string('role').defaultTo('user');
    t.timestamps(true, true);
  });

  await knex.schema.createTable('categories', (t) => {
    t.increments('id').primary();
    t.string('slug').notNullable().unique();
    t.string('name').notNullable();
    t.string('name_en');
    t.string('icon');
  });

  await knex.schema.createTable('products', (t) => {
    t.increments('id').primary();
    t.string('name').notNullable();
    t.string('name_en');
    t.text('description');
    t.integer('price').notNullable();
    t.string('category');
    t.string('image');
    t.string('seller');
    t.float('rating').defaultTo(0);
    t.integer('stock').defaultTo(0);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('orders', (t) => {
    t.increments('id').primary();
    t.string('order_no').notNullable().unique();
    t.integer('user_id').references('id').inTable('users');
    t.string('user_name');
    t.string('user_email');
    t.text('items_json').notNullable();
    t.integer('total').notNullable();
    t.string('payment_method').defaultTo('card');
    t.text('shipping_address_json');
    t.string('status').defaultTo('confirmed');
    t.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('orders');
  await knex.schema.dropTableIfExists('products');
  await knex.schema.dropTableIfExists('categories');
  await knex.schema.dropTableIfExists('users');
};

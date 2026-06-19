exports.up = async function(knex) {
  if (!(await knex.schema.hasTable('restock_notifications'))) {
    await knex.schema.createTable('restock_notifications', (t) => {
      t.increments('id').primary();
      t.integer('product_id').notNullable();
      t.string('email').notNullable();
      t.string('color').nullable();
      t.string('size').nullable();
      t.boolean('notified').defaultTo(false);
      t.timestamps(true, true);
      t.index(['product_id']);
      t.index(['email']);
    });
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('restock_notifications');
};

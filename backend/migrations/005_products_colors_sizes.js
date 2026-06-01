exports.up = async function(knex) {
  if (!(await knex.schema.hasColumn('products', 'colors'))) {
    await knex.schema.alterTable('products', (t) => t.text('colors'));
  }
  if (!(await knex.schema.hasColumn('products', 'sizes'))) {
    await knex.schema.alterTable('products', (t) => t.text('sizes'));
  }
};

exports.down = async function(knex) {
  if (await knex.schema.hasColumn('products', 'sizes')) {
    await knex.schema.alterTable('products', (t) => t.dropColumn('sizes'));
  }
  if (await knex.schema.hasColumn('products', 'colors')) {
    await knex.schema.alterTable('products', (t) => t.dropColumn('colors'));
  }
};

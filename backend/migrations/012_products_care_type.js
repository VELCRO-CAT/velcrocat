exports.up = async function(knex) {
  if (!(await knex.schema.hasColumn('products', 'care_type'))) {
    await knex.schema.alterTable('products', (t) => t.string('care_type').defaultTo('wool'));
  }
};

exports.down = async function(knex) {
  if (await knex.schema.hasColumn('products', 'care_type')) {
    await knex.schema.alterTable('products', (t) => t.dropColumn('care_type'));
  }
};

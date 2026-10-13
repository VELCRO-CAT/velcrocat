exports.up = async function(knex) {
  if (!(await knex.schema.hasColumn('orders', 'guest_password'))) {
    await knex.schema.alterTable('orders', (t) => t.string('guest_password'));
  }
};

exports.down = async function(knex) {
  if (await knex.schema.hasColumn('orders', 'guest_password')) {
    await knex.schema.alterTable('orders', (t) => t.dropColumn('guest_password'));
  }
};

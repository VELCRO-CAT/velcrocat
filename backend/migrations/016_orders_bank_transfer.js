exports.up = async function(knex) {
  if (!(await knex.schema.hasColumn('orders', 'depositor_name'))) {
    await knex.schema.alterTable('orders', (t) => t.string('depositor_name'));
  }
  if (!(await knex.schema.hasColumn('orders', 'deposit_notified_at'))) {
    await knex.schema.alterTable('orders', (t) => t.timestamp('deposit_notified_at'));
  }
};

exports.down = async function(knex) {
  if (await knex.schema.hasColumn('orders', 'deposit_notified_at')) {
    await knex.schema.alterTable('orders', (t) => t.dropColumn('deposit_notified_at'));
  }
  if (await knex.schema.hasColumn('orders', 'depositor_name')) {
    await knex.schema.alterTable('orders', (t) => t.dropColumn('depositor_name'));
  }
};

exports.up = async function(knex) {
  if (!(await knex.schema.hasColumn('orders', 'pay_aid'))) {
    await knex.schema.alterTable('orders', (t) => {
      t.string('pay_aid').index();
    });
  }
};

exports.down = async function(knex) {
  if (await knex.schema.hasColumn('orders', 'pay_aid')) {
    await knex.schema.alterTable('orders', (t) => {
      t.dropColumn('pay_aid');
    });
  }
};

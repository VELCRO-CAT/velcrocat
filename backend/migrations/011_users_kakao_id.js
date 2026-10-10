exports.up = async function(knex) {
  if (!(await knex.schema.hasColumn('users', 'kakao_id'))) {
    await knex.schema.alterTable('users', (t) => {
      t.string('kakao_id').index();
    });
  }
};

exports.down = async function(knex) {
  if (await knex.schema.hasColumn('users', 'kakao_id')) {
    await knex.schema.alterTable('users', (t) => {
      t.dropColumn('kakao_id');
    });
  }
};

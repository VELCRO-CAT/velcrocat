exports.up = async function(knex) {
  if (!(await knex.schema.hasColumn('users', 'naver_id'))) {
    await knex.schema.alterTable('users', (t) => {
      t.string('naver_id').index();
    });
  }
};

exports.down = async function(knex) {
  if (await knex.schema.hasColumn('users', 'naver_id')) {
    await knex.schema.alterTable('users', (t) => {
      t.dropColumn('naver_id');
    });
  }
};

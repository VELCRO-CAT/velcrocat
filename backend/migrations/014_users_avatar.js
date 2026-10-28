exports.up = async function(knex) {
  if (!(await knex.schema.hasColumn('users', 'avatar_url'))) {
    await knex.schema.alterTable('users', (t) => {
      t.string('avatar_url');
    });
  }
};

exports.down = async function(knex) {
  if (await knex.schema.hasColumn('users', 'avatar_url')) {
    await knex.schema.alterTable('users', (t) => {
      t.dropColumn('avatar_url');
    });
  }
};

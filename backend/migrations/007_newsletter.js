exports.up = async function(knex) {
  if (!(await knex.schema.hasTable('newsletter_subscribers'))) {
    await knex.schema.createTable('newsletter_subscribers', (t) => {
      t.increments('id').primary();
      t.string('email', 320).notNullable().unique();
      t.string('source', 64).defaultTo('site_footer');
      t.timestamps(true, true);
    });
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('newsletter_subscribers');
};

exports.up = async function(knex) {
  await knex.schema.createTable('settings', (t) => {
    t.string('key').primary();
    t.text('value');
    t.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('settings');
};

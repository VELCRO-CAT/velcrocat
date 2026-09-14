exports.up = async function(knex) {
  await knex.schema.alterTable('products', (t) => {
    t.text('description_en');
    t.string('name_zh');
    t.text('description_zh');
    t.string('name_ja');
    t.text('description_ja');
  });

  await knex.schema.alterTable('categories', (t) => {
    t.string('name_zh');
    t.string('name_ja');
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('categories', (t) => {
    t.dropColumn('name_zh');
    t.dropColumn('name_ja');
  });
  await knex.schema.alterTable('products', (t) => {
    t.dropColumn('description_en');
    t.dropColumn('name_zh');
    t.dropColumn('description_zh');
    t.dropColumn('name_ja');
    t.dropColumn('description_ja');
  });
};

// 배송지 여러 개 저장 지원 (기본 배송지는 1곳만)
exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('addresses');
  if (!hasTable) {
    await knex.schema.createTable('addresses', (t) => {
      t.increments('id').primary();
      t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.string('recipient');
      t.string('phone');
      t.string('zip');
      t.string('address');
      t.string('address_detail');
      t.string('memo');
      t.boolean('is_default').notNullable().defaultTo(false);
      t.timestamps(true, true);
      t.index('user_id');
    });
  }

  // 기존 users.default_* 컬럼에 저장돼 있던 배송지를 addresses 테이블로 1회 이전
  const hasLegacyCol = await knex.schema.hasColumn('users', 'default_address');
  if (hasLegacyCol) {
    const users = await knex('users')
      .whereNotNull('default_address')
      .select('id', 'default_recipient', 'default_phone', 'default_zip', 'default_address', 'default_address_detail', 'default_memo');

    for (const u of users) {
      const already = await knex('addresses').where('user_id', u.id).first();
      if (already) continue;
      await knex('addresses').insert({
        user_id: u.id,
        recipient: u.default_recipient,
        phone: u.default_phone,
        zip: u.default_zip,
        address: u.default_address,
        address_detail: u.default_address_detail,
        memo: u.default_memo,
        is_default: true
      });
    }
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('addresses');
};

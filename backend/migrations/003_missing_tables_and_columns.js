exports.up = async function(knex) {
  // notifications 테이블
  if (!(await knex.schema.hasTable('notifications'))) {
    await knex.schema.createTable('notifications', (t) => {
      t.increments('id').primary();
      t.string('type');
      t.string('title');
      t.text('message');
      t.string('reference_id');
      t.boolean('is_read').defaultTo(false);
      t.timestamps(true, true);
    });
  }

  // inquiries 테이블
  if (!(await knex.schema.hasTable('inquiries'))) {
    await knex.schema.createTable('inquiries', (t) => {
      t.increments('id').primary();
      t.string('name');
      t.string('phone');
      t.string('email');
      t.string('order_number');
      t.string('inquiry_type');
      t.text('message');
      t.string('status').defaultTo('unread');
      t.timestamps(true, true);
    });
  }

  // products: 추가 이미지 / 상세 블록 (idempotent)
  if (!(await knex.schema.hasColumn('products', 'images'))) {
    await knex.schema.alterTable('products', (t) => t.text('images'));
  }
  if (!(await knex.schema.hasColumn('products', 'detail_blocks'))) {
    await knex.schema.alterTable('products', (t) => t.text('detail_blocks'));
  }

  // categories: 성별 컬럼
  if (!(await knex.schema.hasColumn('categories', 'gender'))) {
    await knex.schema.alterTable('categories', (t) => t.string('gender'));
  }

  // orders: 결제 참조 정보
  if (!(await knex.schema.hasColumn('orders', 'pay_ref_no'))) {
    await knex.schema.alterTable('orders', (t) => t.string('pay_ref_no'));
  }
  if (!(await knex.schema.hasColumn('orders', 'pay_tran_date'))) {
    await knex.schema.alterTable('orders', (t) => t.string('pay_tran_date'));
  }
};

exports.down = async function(knex) {
  await knex.schema.alterTable('orders', (t) => {
    t.dropColumn('pay_ref_no');
    t.dropColumn('pay_tran_date');
  });
  await knex.schema.alterTable('categories', (t) => {
    t.dropColumn('gender');
  });
  await knex.schema.alterTable('products', (t) => {
    t.dropColumn('images');
    t.dropColumn('detail_blocks');
  });
  await knex.schema.dropTableIfExists('inquiries');
  await knex.schema.dropTableIfExists('notifications');
};

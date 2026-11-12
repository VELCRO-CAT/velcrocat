exports.up = async function(knex) {
  if (!(await knex.schema.hasTable('coupons'))) {
    await knex.schema.createTable('coupons', (t) => {
      t.increments('id').primary();
      t.string('code').notNullable().unique();
      t.string('discount_type').notNullable(); // 'FIXED' | 'PERCENT'
      t.integer('discount_value').notNullable();
      t.integer('min_order_amount').nullable();
      t.integer('max_discount_amount').nullable();
      t.timestamp('expires_at').nullable();
      t.integer('usage_limit').nullable();
      t.integer('used_count').notNullable().defaultTo(0);
      t.boolean('is_active').notNullable().defaultTo(true);
      t.timestamps(true, true);
    });
  }
  // orders 테이블에 쿠폰 사용 스냅샷 — 쿠폰이 나중에 수정/삭제돼도 과거 주문 기록은 그대로 보존
  if (!(await knex.schema.hasColumn('orders', 'discount_amount'))) {
    await knex.schema.alterTable('orders', (t) => t.integer('discount_amount').defaultTo(0));
  }
  if (!(await knex.schema.hasColumn('orders', 'coupon_code'))) {
    await knex.schema.alterTable('orders', (t) => t.string('coupon_code').nullable());
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('coupons');
  if (await knex.schema.hasColumn('orders', 'discount_amount')) {
    await knex.schema.alterTable('orders', (t) => t.dropColumn('discount_amount'));
  }
  if (await knex.schema.hasColumn('orders', 'coupon_code')) {
    await knex.schema.alterTable('orders', (t) => t.dropColumn('coupon_code'));
  }
};

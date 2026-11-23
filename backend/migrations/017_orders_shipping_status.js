exports.up = async function(knex) {
  if (!(await knex.schema.hasColumn('orders', 'shipping_status'))) {
    await knex.schema.alterTable('orders', (t) => t.string('shipping_status').defaultTo('preparing'));
  }

  // 기존 status 컬럼에 섞여 있던 배송 진행 상태를 새 shipping_status로 이관하고,
  // status는 결제 상태(paid)만 남긴다 — 이 값들에 도달했다는 건 이미 결제완료 상태였다는 뜻.
  await knex('orders').where('status', 'confirmed').update({ status: 'paid', shipping_status: 'preparing' });
  await knex('orders').where('status', 'processing').update({ status: 'paid', shipping_status: 'preparing' });
  await knex('orders').where('status', 'shipped').update({ status: 'paid', shipping_status: 'shipping' });
  await knex('orders').where('status', 'delivered').update({ status: 'paid', shipping_status: 'delivered' });
};

exports.down = async function(knex) {
  if (await knex.schema.hasColumn('orders', 'shipping_status')) {
    await knex.schema.alterTable('orders', (t) => t.dropColumn('shipping_status'));
  }
};

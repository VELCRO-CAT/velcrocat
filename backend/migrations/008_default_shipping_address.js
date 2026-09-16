// 회원 기본 배송지 컬럼 추가
const COLUMNS = [
  'default_recipient',
  'default_phone',
  'default_zip',
  'default_address',
  'default_address_detail',
  'default_memo'
];

exports.up = async function(knex) {
  for (const c of COLUMNS) {
    if (!(await knex.schema.hasColumn('users', c))) {
      await knex.schema.alterTable('users', (t) => t.string(c));
    }
  }
};

exports.down = async function(knex) {
  await knex.schema.alterTable('users', (t) => {
    for (const c of COLUMNS) t.dropColumn(c);
  });
};

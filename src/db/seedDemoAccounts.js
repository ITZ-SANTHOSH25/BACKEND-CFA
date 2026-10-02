'use strict';

/**
 * Creates the hospital and authority demo accounts used for testing the LifeLink UI.
 * Passwords are stored only as bcrypt hashes. The plaintext credentials are
 * documented in RENDER_SETUP.md for local/demo use and should be changed for
 * any real deployment.
 */
const DEMO_ACCOUNTS = [
  {
    role: 'hospital',
    name: 'Government Hospital',
    email: 'hospital@lifelink.test',
    passwordHash: '$2b$10$bj2.uPyxOJLKrPW4qfv7heqmHNvm1AY0ATsd69M.dvF9aXldgMlr6',
    phone: '9876543210',
    location: 'Coimbatore',
    hospital: {
      name: 'Government Hospital',
      regId: 'HOSP001',
      address: 'Coimbatore, Tamil Nadu',
      contact: '9876543210',
      email: 'hospital@lifelink.test',
      doctor: 'Dr. Kumar',
    },
  },
  {
    role: 'authority',
    name: 'Health Authority',
    email: 'authority@lifelink.test',
    passwordHash: '$2b$10$8YgRZW2yq/wZ/4C5tk5C0.6Ty6XIGlZDTR8/J.SlaZXwq2erKaInO',
    phone: '9876501234',
    location: 'Tamil Nadu',
    authority: {
      name: 'Health Authority',
      authorityId: 'AUTH001',
      officer: 'Health Officer',
      email: 'authority@lifelink.test',
    },
  },
];

function seedDemoAccounts(db) {
  const seed = db.transaction(() => {
    for (const account of DEMO_ACCOUNTS) {
      let user = db.prepare('SELECT id, role FROM users WHERE email = ?').get(account.email);
      let userId;

      if (!user) {
        const info = db.prepare(`
          INSERT INTO users (role, name, email, password_hash, phone, location)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          account.role,
          account.name,
          account.email,
          account.passwordHash,
          account.phone,
          account.location,
        );
        userId = info.lastInsertRowid;
      } else {
        userId = user.id;
      }

      if (account.role === 'hospital') {
        const exists = db.prepare('SELECT id FROM hospitals WHERE user_id = ?').get(userId);
        if (!exists) {
          db.prepare(`
            INSERT INTO hospitals (user_id, name, reg_id, address, contact, email, doctor)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            userId,
            account.hospital.name,
            account.hospital.regId,
            account.hospital.address,
            account.hospital.contact,
            account.hospital.email,
            account.hospital.doctor,
          );
        }
      }

      if (account.role === 'authority') {
        const exists = db.prepare('SELECT id FROM authorities WHERE user_id = ?').get(userId);
        if (!exists) {
          db.prepare(`
            INSERT INTO authorities (user_id, name, authority_id, officer, email)
            VALUES (?, ?, ?, ?, ?)
          `).run(
            userId,
            account.authority.name,
            account.authority.authorityId,
            account.authority.officer,
            account.authority.email,
          );
        }
      }

      const settings = db.prepare('SELECT user_id FROM settings WHERE user_id = ?').get(userId);
      if (!settings) db.prepare('INSERT INTO settings (user_id) VALUES (?)').run(userId);
    }
  });

  seed();
}

module.exports = { seedDemoAccounts };

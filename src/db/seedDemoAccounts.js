'use strict';

/**
 * Creates the three demo accounts used for testing the LifeLink UI.
 * Passwords are stored only as bcrypt hashes. The plaintext credentials are
 * documented in RENDER_SETUP.md for local/demo use and should be changed for
 * any real deployment.
 */
const { hashPassword } = require('../utils/password');

const DEMO_ACCOUNTS = [
  {
    role: 'donor',
    name: 'Demo Donor',
    email: 'donor@lifelink.test',
    password: 'Donor@123',
    phone: '',
    location: '',
  },
  {
    role: 'hospital',
    name: 'Government Hospital',
    email: 'hospital@lifelink.test',
    password: 'Hospital@123',
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
    password: 'Authority@123',
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
          hashPassword(account.password),
          account.phone,
          account.location,
        );
        userId = info.lastInsertRowid;
      } else {
        userId = user.id;
        // Keep the documented demo credentials usable even if an older seed
        // created the account with a mismatched/old bcrypt hash.
        db.prepare('UPDATE users SET role = ?, name = ?, password_hash = ?, phone = ?, location = ? WHERE id = ?')
          .run(account.role, account.name, hashPassword(account.password), account.phone, account.location, userId);
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
        } else {
          db.prepare(`
            UPDATE hospitals SET name = ?, reg_id = ?, address = ?, contact = ?, email = ?, doctor = ?
            WHERE user_id = ?
          `).run(
            account.hospital.name,
            account.hospital.regId,
            account.hospital.address,
            account.hospital.contact,
            account.hospital.email,
            account.hospital.doctor,
            userId,
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
        } else {
          db.prepare(`
            UPDATE authorities SET name = ?, authority_id = ?, officer = ?, email = ?
            WHERE user_id = ?
          `).run(
            account.authority.name,
            account.authority.authorityId,
            account.authority.officer,
            account.authority.email,
            userId,
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

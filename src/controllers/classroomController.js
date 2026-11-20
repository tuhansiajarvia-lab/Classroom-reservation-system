const pool = require('../config/db');

function isAdminUser(user) {
  const role = String(user?.rooli || user?.role || '').toLowerCase();
  return ['admin', 'ylläpitäjä', 'yllapitaja'].includes(role);
}

// Получить список всех классов
exports.getAllClassrooms = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Luokkahuoneet ORDER BY luokka_id ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Virhe luokkahuoneiden haussa:', error);
    res.status(500).json({ message: 'Palvelinvirhe luokkahuoneita haettaessa' });
  }
};

// Создать новый класс (только администратор)
exports.createClassroom = async (req, res) => {
  if (!isAdminUser(req.session?.user)) {
    return res.status(403).json({
      message: 'Vain ylläpitäjä voi lisätä luokkahuoneita'
    });
  }

  const nimi = req.body.nimi || req.body.name;
  const rivit = Number(req.body.rivit ?? req.body.rows ?? 0);
  const paikat = Number(req.body.paikat ?? req.body.seats ?? 0);
  const koko = Number(req.body.koko ?? req.body.capacity ?? (rivit * paikat));
  const projektori = req.body.projektori ?? req.body.has_projector ?? 1;
  const interaktiivinen_taulu = req.body.interaktiivinen_taulu ?? req.body.has_smartboard ?? 1;

  if (!nimi) {
    return res.status(400).json({ message: 'Ilmoita luokkahuoneen nimi' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO Luokkahuoneet (nimi, koko, rivit, paikat, projektori, interaktiivinen_taulu)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nimi, koko || 0, rivit || 0, paikat || 0, projektori ? 1 : 0, interaktiivinen_taulu ? 1 : 0]
    );

    res.status(201).json({
      message: 'Luokkahuone lisätty onnistuneesti',
      luokka_id: result.insertId
    });
  } catch (error) {
    console.error('Virhe luokkahuoneen lisäyksessä:', error);
    res.status(500).json({ message: 'Palvelinvirhe luokkahuonetta lisättäessä' });
  }
};

// Удалить класс (только администратор)
exports.deleteClassroom = async (req, res) => {
  if (!isAdminUser(req.session?.user)) {
    return res.status(403).json({
      message: 'Vain ylläpitäjä voi poistaa luokkahuoneita'
    });
  }

  const classroomId = Number(req.params.id);
  if (!Number.isInteger(classroomId) || classroomId <= 0) {
    return res.status(400).json({ message: 'Virheellinen luokkahuoneen ID' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT luokka_id FROM Luokkahuoneet WHERE luokka_id = ?',
      [classroomId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: 'Luokkahuonetta ei löytynyt' });
    }

    await pool.query('DELETE FROM Luokkahuoneet WHERE luokka_id = ?', [classroomId]);

    res.json({ message: 'Luokkahuone poistettu onnistuneesti' });
  } catch (error) {
    console.error('Virhe luokkahuoneen poistossa:', error);
    res.status(500).json({ message: 'Palvelinvirhe luokkahuonetta poistettaessa' });
  }
};
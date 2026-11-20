const pool = require('../config/db');

function getRole(user) {
  return String(user?.rooli || user?.role || '').toLowerCase();
}

function isAdmin(user) {
  return ['admin', 'ylläpitäjä', 'yllapitaja'].includes(getRole(user));
}

function canViewAllBookings(user) {
  return ['admin', 'ylläpitäjä', 'yllapitaja', 'opettaja', 'teacher'].includes(getRole(user));
}

// Занятость классов на дату: учителя и админы видят все активные брони, ученики — пустой список
exports.getClassroomAvailability = async (req, res) => {
  const user = req.session?.user;
  if (!user?.id) {
    return res.status(401).json({ message: 'Kirjautuminen vaaditaan' });
  }

  const date = req.query.date || new Date().toISOString().slice(0, 10);

  if (!canViewAllBookings(user)) {
    return res.json([]);
  }

  try {
    const [rows] = await pool.query(
      `SELECT
         v.varaus_id,
         v.kayttaja_id,
         v.luokka_id,
         v.ajankohta,
         v.status
       FROM Varaukset v
       WHERE DATE(v.ajankohta) = ?
         AND v.status = 'active'`,
      [date]
    );

    res.json(rows);
  } catch (error) {
    console.error('Virhe käyttöasteen haussa:', error);
    res.status(500).json({ message: 'Palvelinvirhe käyttöastetta haettaessa' });
  }
};

// Создать бронь класса на выбранную дату
exports.createReservation = async (req, res) => {
  const luokka_id = req.body.luokka_id || req.body.classroomId;
  const ajankohta = req.body.ajankohta || req.body.date;

  if (!luokka_id || !ajankohta) {
    return res.status(400).json({
      message: 'Ilmoita luokan ID ja päivämäärä'
    });
  }

  const kayttaja_id = req.session?.user?.id;
  if (!kayttaja_id) {
    return res.status(401).json({
      message: 'Kirjautuminen vaaditaan'
    });
  }

  try {
    const [room] = await pool.query(
      'SELECT luokka_id, nimi, koko FROM Luokkahuoneet WHERE luokka_id = ?',
      [luokka_id]
    );

    if (room.length === 0) {
      return res.status(404).json({
        message: 'Luokkaa ei löytynyt'
      });
    }

    const [existing] = await pool.query(
      `SELECT varaus_id FROM Varaukset
       WHERE luokka_id = ?
       AND DATE(ajankohta) = ?
       AND status = 'active'`,
      [luokka_id, ajankohta]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: 'Luokka on jo varattu valittuna päivänä.'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO Varaukset (kayttaja_id, luokka_id, ajankohta, status)
       VALUES (?, ?, ?, 'active')`,
      [kayttaja_id, luokka_id, `${ajankohta} 00:00:00`]
    );

    res.status(201).json({
      message: 'Luokka on varattu onnistuneesti',
      varaus_id: result.insertId
    });
  } catch (error) {
    console.error('Virhe luokan varauksen luomisessa:', error);
    res.status(500).json({
      message: 'Palvelinvirhe varausta tehtäessä'
    });
  }
};

// Получить активные бронирования текущего пользователя
exports.getMyReservations = async (req, res) => {
  const kayttaja_id = req.session?.user?.id;
  if (!kayttaja_id) {
    return res.status(401).json({
      message: 'Kirjautuminen vaaditaan'
    });
  }

  try {
    const [rows] = await pool.query(
      `SELECT
         v.varaus_id,
         v.kayttaja_id,
         v.luokka_id,
         v.ajankohta,
         v.status,
         v.created_at,
         l.nimi AS luokka_nimi,
         l.koko,
         l.rivit,
         l.paikat
       FROM Varaukset v
       JOIN Luokkahuoneet l ON v.luokka_id = l.luokka_id
       WHERE v.kayttaja_id = ?
         AND v.status = 'active'
       ORDER BY v.ajankohta DESC, v.varaus_id DESC`,
      [kayttaja_id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Virhe varausten haussa:', error);
    res.status(500).json({
      message: 'Palvelinvirhe varauksia haettaessa'
    });
  }
};

// Удалить бронь
exports.deleteReservation = async (req, res) => {
  const varausId = Number(req.params.id);
  const user = req.session?.user;

  if (!user?.id) {
    return res.status(401).json({
      message: 'Kirjautuminen vaaditaan'
    });
  }

  if (!Number.isInteger(varausId) || varausId <= 0) {
    return res.status(400).json({
      message: 'Virheellinen varauksen ID'
    });
  }

  try {
    const [rows] = await pool.query(
      'SELECT varaus_id, kayttaja_id FROM Varaukset WHERE varaus_id = ?',
      [varausId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Varausta ei löytynyt'
      });
    }

    const reservation = rows[0];

    if (reservation.kayttaja_id !== user.id && !isAdmin(user)) {
      return res.status(403).json({
        message: 'Sinulla ei ole oikeutta poistaa tätä varausta'
      });
    }

    await pool.query('DELETE FROM Varaukset WHERE varaus_id = ?', [varausId]);

    res.json({
      message: 'Varaus poistettu onnistuneesti'
    });
  } catch (error) {
    console.error('Virhe varausta poistettaessa:', error);
    res.status(500).json({
      message: 'Palvelinvirhe varausta poistettaessa'
    });
  }
};
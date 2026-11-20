const pool = require('../config/db'); // проверьте путь до подключения к БД, если у вас он называется иначе

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
    // 1. Проверяем, что класс существует
    const [room] = await pool.query(
      'SELECT luokka_id, nimi, koko FROM Luokkahuoneet WHERE luokka_id = ?',
      [luokka_id]
    );

    if (room.length === 0) {
      return res.status(404).json({
        message: 'Luokkaa ei löytynyt'
      });
    }

    // 2. Проверяем, не забронирован ли класс на выбранную дату
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

    // 3. Создаём одну запись бронирования класса
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
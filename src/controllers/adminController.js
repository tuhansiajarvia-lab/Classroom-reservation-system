const pool = require('../config/db');

// Luo uusi luokkahuone (ilman erillisiä paikkoja)
exports.createClassroom = async (req, res) => {
  const { nimi, rivit, paikat } = req.body;

  const rowsCount = Number(rivit);
  const seatsPerRow = Number(paikat);

  if (!nimi || !rowsCount || !seatsPerRow) {
    return res.status(400).json({
      message: 'Ilmoita nimi, rivien määrä ja paikkojen määrä rivillä'
    });
  }

  const koko = rowsCount * seatsPerRow;

  try {
    const [classroomResult] = await pool.query(
      `INSERT INTO Luokkahuoneet
       (nimi, koko, rivit, paikat)
       VALUES (?, ?, ?, ?)`,
      [nimi, koko, rowsCount, seatsPerRow]
    );

    res.status(201).json({
      message: 'Luokkahuone luotiin onnistuneesti',
      luokka_id: classroomResult.insertId,
      total_seats: koko
    });
  } catch (error) {
    console.error('Virhe salin luomisessa:', error);

    res.status(500).json({
      message: 'Palvelinvirhe salia luotaessa'
    });
  }
};

// Hae kaikki aktiiviset luokkavaraukset
exports.getAllReservations = async (req, res) => {
  try {
    const [reservations] = await pool.query(
      `SELECT
        v.varaus_id,
        v.kayttaja_id,
        v.luokka_id,
        v.ajankohta,
        v.status,
        k.nimi AS student_nimi,
        k.sahkoposti,
        l.nimi AS luokka_nimi,
        l.koko,
        l.rivit,
        l.paikat
       FROM Varaukset v
       JOIN Kayttajat k
         ON v.kayttaja_id = k.kayttaja_id
       JOIN Luokkahuoneet l
         ON v.luokka_id = l.luokka_id
       WHERE v.status = 'active'
       ORDER BY v.ajankohta DESC, v.varaus_id DESC`
    );

    res.json(reservations);
  } catch (error) {
    console.error('Virhe kaikkien varausten hakemisessa:', error);

    res.status(500).json({
      message: 'Palvelinvirhe'
    });
  }
};

// Poista luokkahuone (sekä siihen liittyvät varaukset)
exports.deleteClassroom = async (req, res) => {
  const { id } = req.params;
  const classroomId = Number(id);

  if (!Number.isInteger(classroomId) || classroomId <= 0) {
    return res.status(400).json({
      message: 'Virheellinen luokkahuoneen ID'
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Удаляем связанные с классом брони, чтобы не было конфликта внешнего ключа
    await connection.query(
      'DELETE FROM Varaukset WHERE luokka_id = ?',
      [classroomId]
    );

    const [result] = await connection.query(
      'DELETE FROM Luokkahuoneet WHERE luokka_id = ?',
      [classroomId]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        message: 'Luokkahuonetta ei löytynyt'
      });
    }

    await connection.commit();

    res.json({
      message: 'Luokkahuone poistettu onnistuneesti'
    });
  } catch (error) {
    await connection.rollback();

    console.error('Virhe luokan poistamisessa:', error);

    res.status(500).json({
      message: 'Palvelinvirhe luokkaa poistettaessa'
    });
  } finally {
    connection.release();
  }
};
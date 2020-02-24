---
layout: post
title: "Database locks on long reads with SQLite 3 or RTFM carefully"
---

Recently I was working with a SQLite 3 database that kept throwing "database is locked" errors. Long story short, I was being an idiot and didn't realize that read operations that took longer than five seconds could lock the database. I had thought this only applied to write transactions, but thinking about it now, it makes perfect sense that read operations will also block the database if a writer is waiting.

By default a writer cannot make changes to the database until all readers are finished. If a writer has a lock on the database, then all writers and readers must wait. With WAL (Write Ahead Logging) enabled, then there can be one writer and multiple readers at the same time. The reason multiple writers are not allowed is because SQLite 3 uses file level locking.

SQLite 3's default behavior is to create a rollback journal file of the old data. Inserts/updates/deletes are then performed on the live database file. If readers were allowed, then they would be reading incomplete data. This is why write operations require an EXCLUSIVE lock instead of the SHARED lock that readers use.

In WAL mode, the journal file contains the changes that will be applied to the live database file. This approach allows readers to query the database at anytime.

There are some drawbacks to WAL though. In particular, I am concerned about long transactions since that's precisely the case where SQLite 3's default behavior causes problems with database locks. This is something that I need to experiment with and test out.

This is a case of RTFM carefully. Although I understood that SQLite 3 had concurrency issues due to the file level locking scheme, I had missed the point that a SHARED lock on the database would force a EXCLUSIVE lock to wait.

In the end, after some discussion with my co-workers, I was able to verify this behavior by writing some test code where one program ran a long inefficient SELECT query and another program updated a counter table in an infinite loop. After five seconds, the second program would crash with a "database is locked" error.

The following is the code for the experiment:

**constants.py**

```python
DB_FILE = 'test.db'
UPDATES_TABLE = 'updates'
```

**install.py**

```python
import random
import sqlite3

from constants import DB_FILE

NUM_RECORDS =  1000000
NUM_TABLES = 6

SCHEMA = """
    CREATE TABLE IF NOT EXISTS t0 (
        id INTEGER PRIMARY KEY,
        count INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS t1 (
        id INTEGER PRIMARY KEY,
        count INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS t2 (
        id INTEGER PRIMARY KEY,
        count INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS t3 (
        id INTEGER PRIMARY KEY,
        count INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS t4 (
        id INTEGER PRIMARY KEY,
        count INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS t5 (
        id INTEGER PRIMARY KEY,
        count INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS updates (
        id INTEGER PRIMARY KEY,
        count INTEGER
    );

    REPLACE INTO updates VALUES (1, 1);
"""

def insert_records(conn, table_name):
    for _ in xrange(NUM_RECORDS):
        conn.execute("INSERT INTO {} (count) VALUES (?)".format(table_name), (random.randint(1, 10),))


def clear_data(conn):
    for i in xrange(NUM_TABLES):
        conn.execute('DELETE FROM t{}'.format(i))

conn = sqlite3.connect(DB_FILE)
cursor = conn.cursor()
cursor.executescript(SCHEMA)
conn.commit()

clear_data(conn)
for table_number in xrange(NUM_TABLES):
    insert_records(conn, 't{}'.format(table_number))
conn.commit()

conn.close()
```

**write_loop.py**

```python
import sqlite3
from constants import DB_FILE, UPDATES_TABLE

conn = sqlite3.connect(DB_FILE)
cursor = conn.cursor()
count = 1
while True:
    cursor.execute("UPDATE updates set count = ? where id = 1", (count,))
    conn.commit()
    count += 1
conn.close()
```

**long_read.py**

```python
import sqlite3
from constants import DB_FILE

query = """
    SELECT * from t0
        LEFT JOIN t1 on t1.count = t0.count
        LEFT JOIN t2 on t2.count = t1.count
        LEFT JOIN t3 on t3.count = t2.count
        LEFT JOIN t4 on t4.count = t3.count
        LEFT JOIN t5 on t5.count = t4.count
"""

conn = sqlite3.connect(DB_FILE)
cursor = conn.cursor()
cursor.execute(query)
conn.close()
```

**Resources**

- [SQLite 3 documentation on locking](http://www.sqlite.org/lockingv3.html)

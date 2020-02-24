---
layout: post
title: "Using PostgreSQL FDW with SQLAlchemy"
---

PostgreSQL has a feature called Foreign Data Wrapper (FDW). This allows a PostgreSQL database to connect to a remote data source and query the data as if it were a native table. These data sources can be a CSV file, a web service API, another PostgreSQL database, or any other database. All that's required is an FDW for the specific source.

Performance of querying and working with FDW data sources depends on the implementation of individual extensions. Regardless there will be a performance hit. The `postgres_fdw` extension is developed and maintained by PostgreSQL, so its performance has improved over the years.

The idea of being able to access data from one PostgreSQL database to another seems very useful. For example if we wanted to store user accounts in their own database. Or if we needed to access data from a different service.

Setting up the `postres_fdw` extension and being able to query data from a remote database is not too difficult. The main thing to be aware of is the `pg_hba.conf` configuration and PostgreSQL role management. We definitely want to make sure access is restricted at the right levels.

The next question that will come to mind is how can these foreign tables be queried in our application code. In this scenario, we'll assume the usage of SQLAlchemy ORM as our data access layer. The first thing we'll find out is that neither SQLAlchemy Core or ORM have support for Foreign Data Wrapper, which means we'll have to write our own DDL code to make it work.

Before we get into SQLAlchemy integration, let's go over the basic commands for using Foreign Data Wrapper with another PostgreSQL database.

## PostgreSQL FDW Basics

First we need to enable the `postgres_fdw` extension. It is already included in the default PostgreSQL installation, so we just need to enable the extension. We want to enable this extension on the database that will be querying the remote table.

```sql
CREATE EXTENSION postgres_fdw;
```

To disable the extension, we can use `DROP EXTENSION`. `CASCADE` can be added to drop servers, user mappings, and foreign tables associated with the extension at the same time.

```sql
DROP EXTENSION postgres_fdw CASCADE;
```

Next we create an entry for the remote PostreSQL server and database we want to connect to.

```sql
CREATE SERVER {remote_server_name}
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (host 'localhost', port '5432', dbname '{remote_db_name}');
```

To connect to the server created above, we need to map our application role to a role on the remote server.

```sql
CREATE USER MAPPING FOR {app_role}
SERVER {remote_server_name}
OPTIONS (user '{remote_role}', password 'password');
```

The `CREATE FOREIGN TABLE` command will create a proxy table of the remote table to query. The mapping of columns does not have to be the same. You can include only specific columns, so long as the column names are the same.

Creating the schema for each foreign table can be tedious, so there is also an option to import the whole schema with one command.

One other thing to keep in mind is that the correct privileges need to be granted to the application role in order to query the remote table.

```sql
CREATE FOREIGN TABLE {remote_table_name} (
        id INTEGER NOT NULL,
        data TEXT
)
SERVER {remote_server_name}
OPTIONS (schema_name 'public', table_name '{table_name}');
```

Helpful resources for using the `postgres_fdw` extension:

 - [Foreign Data Wrappers in PostgreSQL and a closer look at postgres_fdw](https://www.percona.com/blog/2018/08/21/foreign-data-wrappers-postgresql-postgres_fdw/)
- [PostgreSQL documentation on postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html)

## Integrating postgres_fdw into SQLAlchemy

When integrating postgres_fdw support into SQLAlchemy for a typical web application, we need to consider the following questions:

- Can the foreign tables be created and dropped in application code for integration and/or unit test purposes?
- Can the addition of foreign tables be detected by database migrations (Alembic)?
- Can postgres_fdw configuration be deployed to servers (Ansible)?
- Can we query the table without writing out the SQL?

In order to use foreign tables with SQLAlchemy, we will need to implement the following commands:

- CREATE SERVER
- CREATE USER MAPPING
- CREATE FOREIGN TABLE

We will skip `CREATE EXTENSION` since that is better left to a superuser. This means that the `postgres_fdw` extension must be enabled on the server ahead of time. This can be done through Ansible via the `postgresql_ext` module. Alternatively if you're running a PostgreSQL instance in a Docker container, you can add the command to your initialization script. You're also free to simply manually run the command.

The other thing to note here is that you will need to grant your application role the ability to run use the `postgres_fdw` extension, thus allowing that role to run the three commands mentioned above. This is necessary for the unit testing scenario where the database needs to be repeatedly recreated.

Example command:

```sql
GRANT USAGE ON FOREIGN DATA WRAPPER postgres_fdw TO app_user;
```

As of Ansible 2.8, you can grant `FOREIGN DATA WRAPPER` privileges to a role using the `postgresql_privs` module.

### Create/Drop Server - DDL

```python
import sqlalchemy as sa
from sqlalchemy.ext import compiler
from sqlalchemy.schema import DDLElement


class CreateServer(DDLElement):
    def __init__(self, server_name, remote_db_name, remote_host, remote_port):
        self.server_name = server_name
        self.remote_db_name = remote_db_name
        self.remote_host = remote_host
        self.remote_port = remote_port


@compiler.compiles(CreateServer)
def compile_create_server(element, compiler, **kw):
    return (
        """
            CREATE SERVER {}
            FOREIGN DATA WRAPPER postgres_fdw
            OPTIONS(dbname '{}', host '{}', port '{}');
        """.format(
            element.server_name,
            element.remote_db_name,
            element.remote_host,
            element.remote_port,
        )
    )


class DropServer(DDLElement):
    def __init__(self, server_name):
        self.server_name = server_name


@compiler.compiles(DropServer)
def compile_drop_server(element, compiler, **kw):
    return "DROP SERVER IF EXISTS {} CASCADE;".format(element.server_name)


def create_server(server_name, remote_db_name, remote_host, remote_port, metadata):
    sa.event.listen(
        metadata,
        "after_create",
        CreateServer(server_name, remote_db_name, remote_host, remote_port),
    )

    sa.event.listen(
        metadata,
        "before_drop",
        DropServer(server_name)
    )
```

To create a server, all we need to do is call the `create_server` function. All this does is add listeners for database create/drop events.

```python
metadata.drop_all(db)  # Will run command to drop server
metadata.create_all(db)  # Will run command to create server
```

This sets us for the unit test scenario and also the scenario where a dev is setting up their local development environment for the first time.

This configuration however does not help us for the existing database case since these commands would not be triggered. For that we will need to apply a db migration.

The only other thing to note about this code is that I'm not escaping the parameters properly. There's likely a way to do that, but for this experiment I have not done so.


### Create/Drop User Mapping - DDL

The DDL for `USER MAPPING` follows the same pattern as `SERVER`. It also has the same caveats in regard to db migrations and escaping parameters.

```python
import sqlalchemy as sa
from sqlalchemy.ext import compiler
from sqlalchemy.schema import DDLElement


@compiler.compiles(CreateUserMapping)
def compile_create_user_mapping(element, compiler, **kw):
    return (
        """
            CREATE USER MAPPING for {}
            SERVER {}
            OPTIONS(user '{}', password '{}');
        """.format(
            element.role,
            element.server_name,
            element.remote_role,
            element.remote_password,
        )
    )


class DropUserMapping(DDLElement):
    def __init__(self, role, server_name):
        self.role = role
        self.server_name = server_name


@compiler.compiles(DropUserMapping)
def compile_drop_user_mapping(element, compiler, **kw):
    return "DROP USER MAPPING IF EXISTS FOR {} SERVER {};".format(element.role, element.server_name)


def create_user_mapping(role, server_name, remote_role, remote_password, metadata):
    sa.event.listen(
        metadata,
        "after_create",
        CreateUserMapping(role, server_name, remote_role, remote_password),
    )

    sa.event.listen(
        metadata,
        "before_drop",
        DropUserMapping(role, server_name)
    )
```


### Create/Drop Foreign Table - DDL

```python
import sqlalchemy as sa
from sqlalchemy.ext import compiler
from sqlalchemy.schema import CreateColumn, DDLElement


class CreateForeignTable(DDLElement):
    def __init__(self, table_name, columns, server_name, remote_schema_name, remote_table_name):
        self.table_name = table_name
        self.columns = columns
        self.server_name = server_name
        self.remote_schema_name = remote_schema_name
        self.remote_table_name = remote_table_name


@compiler.compiles(CreateForeignTable)
def compile_create_foreign_table(element, compiler, **kw):
    columns = [compiler.process(CreateColumn(column), **kw) for column in element.columns]
    return (
        """
            CREATE FOREIGN TABLE {}
            ({})
            SERVER {}
            OPTIONS(schema_name '{}', table_name '{}');
        """.format(
            element.table_name,
            ", ".join(columns),
            element.server_name,
            element.remote_schema_name,
            element.remote_table_name,
        )
    )


class DropForeignTable(DDLElement):
    def __init__(self, name):
        self.name = name


@compiler.compiles(DropForeignTable)
def compile_drop_foreign_table(element, compiler, **kw):
    return "DROP FOREIGN TABLE IF EXISTS {};".format(element.name)


def create_foreign_table(table_name, columns, server_name, remote_schema_name, remote_table_name, metadata):
    sa.event.listen(
        metadata,
        "after_create",
        CreateForeignTable(table_name, columns, server_name, remote_schema_name, remote_table_name),
    )

    sa.event.listen(
        metadata,
        "before_drop",
        DropForeignTable(table_name)
    )
```

The DDL for creating/dropping foreign tables is very similar to the previous two DDL's.

One big difference is that we need to generate the SQL for the columns of the foreign table. This syntax is the same as for `CREATE TABLE`, so we can leverage existing an DDL called `CreateColumn`

The code looks like this (as seen in `compile_create_foreign_table`):

```python
columns = [compiler.process(CreateColumn(column), **kw) for column in element.columns]
```

The objects in `elements.columns` come from a SQLAlchemy core table schema. So let's say we have a table called `guestbook` that we want to query on the remote table.

```python
guestbook = Table(
    "guestbook", metadata,
    Column("id", Integer, primary_key=True, nullable=False),
    Column("name", TEXT, nullable=False),
    Column("email", TEXT, nullable=False),
    Column("message", TEXT, nullable=False),
    Column("created_at", DateTime, nullable=False, server_default=func.now()),
)
```

To create the foreign table we can pass in the columns from the guestbook table instance here, like this `guestbook.c`. Calling the `create_foreign_table` function, it would look like this:

```python
create_foreign_table("guestbook_fdw", guestbook.c, "remove_server", "public", "guestbook", metadata)
```

The current implementation of this foreign table DDL is incomplete. Currently it does not return a table that is queryable using SQLAlchemy Core or ORM. This is because I never intended to query the remote table directly. Instead, data would be queried from a materialized view based on the foreign table.

On a side note, the `sqlalchemy-utils` module contains DDL implementations for using materialization views.

### DB Migrations with Alembic

Currently DB migrations would not be triggered with the creation of the above DDL elements.

In this case, I felt it would be simple enough to use `op.execute` to write out the necessary commands manually in the Alembic migration file. To avoid, hardcoding remote servers and credentials, you can import your settings via environment variables or configuration files.

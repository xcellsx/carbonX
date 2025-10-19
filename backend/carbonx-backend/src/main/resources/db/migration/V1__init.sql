-- Users
create table if not exists users (
  id identity primary key,
  email varchar(255) not null unique,
  name varchar(255) not null,
  created_at timestamp not null
);

-- Projects
create table if not exists projects (
  id identity primary key,
  name varchar(255) not null,
  description text,
  created_at timestamp not null
);

-- Calculations
create table if not exists calculations (
  id identity primary key,
  project_id bigint not null references projects(id),
  input_json text,
  result_json text,
  created_at timestamp not null
);

-- Chat messages
create table if not exists chat_messages (
  id identity primary key,
  project_id bigint not null references projects(id),
  sender varchar(128) not null,
  message text not null,
  created_at timestamp not null
);

-- Analytics events
create table if not exists analytics_events (
  id identity primary key,
  project_id bigint not null references projects(id),
  type varchar(128) not null,
  metadata_json text,
  created_at timestamp not null
);

-- Reports
create table if not exists reports (
  id identity primary key,
  project_id bigint not null references projects(id),
  title varchar(255) not null,
  content text not null,
  created_at timestamp not null
);

-- Network links
create table if not exists network_links (
  id identity primary key,
  project_id bigint not null references projects(id),
  from_node varchar(255) not null,
  to_node varchar(255) not null,
  weight double not null
);



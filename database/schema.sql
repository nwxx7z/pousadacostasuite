CREATE TABLE IF NOT EXISTS rooms (id SERIAL PRIMARY KEY, number INTEGER UNIQUE NOT NULL, name TEXT NOT NULL, active BOOLEAN NOT NULL DEFAULT true);
CREATE TABLE IF NOT EXISTS prices (id SERIAL PRIMARY KEY, room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE, price NUMERIC(10,2) NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, CHECK(end_date >= start_date));
CREATE TABLE IF NOT EXISTS availability_blocks (id SERIAL PRIMARY KEY, room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE, reason TEXT, start_date DATE NOT NULL, end_date DATE NOT NULL, CHECK(end_date >= start_date));
INSERT INTO rooms(number,name) VALUES
(1,'Suíte Casal'),(2,'Suíte Casal'),(3,'Suíte Casal'),(4,'Suíte Quádrupla'),(5,'Suíte com Vista para o Mar'),(6,'Suíte com Varanda e Vista para o Mar'),(7,'Suíte com Varanda e Vista para o Mar')
ON CONFLICT(number) DO NOTHING;
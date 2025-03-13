CREATE DATABASE rifa_db;
USE rifa_db;

CREATE TABLE compras_rifa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    numero INT NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    data_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

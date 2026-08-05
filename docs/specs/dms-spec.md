# Especificação - Document Management System (DMS)

## 1. Objetivo

Entregar um sistema web para gestão de documentos com upload, listagem e download por usuário, usando armazenamento local de arquivos com `multer` e metadados em memória.

## 2. Escopo

### Dentro do escopo

- Upload de documentos.
- Listagem de documentos por usuário.
- Download de documento por identificador.
- Backend em camadas (`routes -> controllers -> services -> repositories`).
- Frontend React integrado ao backend via `/api`.

### Fora do escopo

- Armazenamento externo (S3, GCS, Azure etc.).
- Versionamento de documentos.
- Busca textual avançada.
- Workflow de aprovação.
- Autenticação avançada (JWT/OAuth).

## 3. Requisitos funcionais

| ID | Requisito |
|---|---|
| RF-01 | O sistema deve permitir upload de um documento via `POST /upload`. |
| RF-02 | O upload deve aceitar `multipart/form-data` com campo `file`. |
| RF-03 | O sistema deve identificar o dono do documento por `x-user-id`. |
| RF-04 | O sistema deve rejeitar upload sem arquivo com erro de validação. |
| RF-05 | O sistema deve rejeitar requisição sem `x-user-id` com erro de validação. |
| RF-06 | O sistema deve retornar metadados do documento criado após upload com sucesso. |
| RF-07 | O sistema deve listar apenas documentos do usuário em `GET /documents`. |
| RF-08 | A listagem deve retornar documentos em ordem de upload decrescente. |
| RF-09 | O sistema deve permitir download em `GET /documents/:id/download`. |
| RF-10 | O download deve ser permitido apenas ao dono do documento. |
| RF-11 | O sistema deve expor `GET /health` para verificação de saúde. |
| RF-12 | O frontend deve permitir upload, listagem e download com feedback de erro/sucesso. |

## 4. Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF-01 | Backend em Node.js + Express (CommonJS). |
| RNF-02 | Frontend em React + Vite (ESM). |
| RNF-03 | Arquivos devem ser gravados somente no filesystem local com `multer.diskStorage` em `backend/storage`. |
| RNF-04 | Metadados devem ser mantidos em memória nesta fase. |
| RNF-05 | Deve respeitar Clean Architecture simples com fluxo `routes -> controllers -> services -> repositories`. |
| RNF-06 | Configuração via variáveis de ambiente (12-Factor). |
| RNF-07 | Erros devem ser tratados nos limites da aplicação com respostas HTTP consistentes. |
| RNF-08 | Código simples, legível e sem overengineering. |
| RNF-09 | Backend com testes automatizados usando `node:test`. |

## 5. Modelo de dados

Entidade: `DocumentMetadata`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| id | string | Sim | Identificador único do documento. |
| originalName | string | Sim | Nome original do arquivo enviado. |
| filename | string | Sim | Nome gerado para gravação no disco. |
| mimeType | string | Sim | Tipo MIME do arquivo. |
| size | number | Sim | Tamanho em bytes. |
| uploadedAt | string (ISO 8601) | Sim | Data e hora do upload em UTC. |
| owner | string | Sim | Usuário dono do documento (`x-user-id`). |
| storagePath | string | Sim | Caminho interno do arquivo no filesystem local. |

Regras:

- `id` deve ser único.
- `owner` é obrigatório para upload, listagem e download.
- Metadados são voláteis e se perdem ao reiniciar o processo backend.

## 6. Contratos de API

Base local: `http://localhost:3000`

No frontend, chamadas são feitas em `/api` (proxy do Vite).

### 6.1 `GET /health`

Resposta de sucesso:

- Status: `200 OK`
- Body:

```json
{
  "status": "ok"
}
```

### 6.2 `POST /upload`

Entrada:

- Header obrigatório: `x-user-id`
- Content-Type: `multipart/form-data`
- Campo obrigatório: `file`

Resposta de sucesso:

- Status: `201 Created`
- Body:

```json
{
  "id": "2b9c4c28-2be0-44a7-bc8f-15d6c95d14b3",
  "originalName": "contrato.pdf",
  "filename": "1722854400000-contrato.pdf",
  "mimeType": "application/pdf",
  "size": 84512,
  "uploadedAt": "2026-08-05T14:25:00.000Z",
  "owner": "user-123"
}
```

Erros esperados:

- `400 Bad Request`: `x-user-id` ausente.
- `400 Bad Request`: arquivo ausente.
- `500 Internal Server Error`: erro inesperado.

### 6.3 `GET /documents`

Entrada:

- Header obrigatório: `x-user-id`

Resposta de sucesso:

- Status: `200 OK`
- Body:

```json
[
  {
    "id": "2b9c4c28-2be0-44a7-bc8f-15d6c95d14b3",
    "originalName": "contrato.pdf",
    "filename": "1722854400000-contrato.pdf",
    "mimeType": "application/pdf",
    "size": 84512,
    "uploadedAt": "2026-08-05T14:25:00.000Z",
    "owner": "user-123"
  }
]
```

Erros esperados:

- `400 Bad Request`: `x-user-id` ausente.
- `500 Internal Server Error`: erro inesperado.

### 6.4 `GET /documents/:id/download`

Entrada:

- Header obrigatório: `x-user-id`
- Path param obrigatório: `id`

Resposta de sucesso:

- Status: `200 OK`
- Body: binário do arquivo.
- Headers esperados:
  - `Content-Type`: MIME do arquivo.
  - `Content-Disposition`: `attachment; filename="<originalName>"`

Erros esperados:

- `400 Bad Request`: `x-user-id` ausente.
- `404 Not Found`: documento inexistente.
- `403 Forbidden`: documento pertence a outro usuário.
- `410 Gone`: metadado existe, mas arquivo físico não existe.
- `500 Internal Server Error`: erro inesperado.

### 6.5 Formato padrão de erro

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "x-user-id header is required"
  }
}
```

Códigos sugeridos: `VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`, `FILE_MISSING`, `INTERNAL_ERROR`.

## 7. Decisões arquiteturais

- Backend em Clean Architecture simples:
  - `routes`: mapeia endpoints e middlewares.
  - `controllers`: valida entrada HTTP e formata respostas.
  - `services`: aplica regras de negócio.
  - `repositories`: persistência local (arquivos e metadados).
- Dependência em fluxo único: `routes -> controllers -> services -> repositories`.
- Arquivos persistidos exclusivamente em `backend/storage` com `multer.diskStorage`.
- Metadados em memória para manter seed evolutivo e simples.

## 8. Plano de execução em etapas

1. Estruturar backend por camadas
- Criar módulos de `routes`, `controllers`, `services`, `repositories`.
- Definir contratos internos e modelo de erro.

2. Implementar upload local
- Configurar `multer.diskStorage` para `backend/storage`.
- Gravar metadados em memória após upload.

3. Implementar listagem por usuário
- Filtrar documentos por `owner` (`x-user-id`).
- Ordenar por data de upload (descendente).

4. Implementar download seguro
- Validar existência do documento.
- Validar ownership.
- Validar existência física no disco.

5. Implementar testes backend
- Cobrir sucesso e falha para upload/listagem/download.
- Garantir estabilidade da API com `node:test`.

6. Integrar frontend
- Formulário de upload.
- Lista de documentos.
- Ação de download.
- Feedback de carregamento e erro.

7. Consolidar documentação
- Registrar exemplos de uso da API.
- Documentar limitações da fase atual (metadados em memória).

## 9. Critérios de aceite

- `POST /upload`, `GET /documents` e `GET /documents/:id/download` funcionando conforme contratos.
- Armazenamento de arquivo somente local via `multer`.
- Metadados mantidos em memória e vinculados por usuário.
- Backend organizado por camadas com responsabilidades claras.
- Frontend operando fluxo completo com proxy `/api`.
- Testes cobrindo cenários principais e de erro.

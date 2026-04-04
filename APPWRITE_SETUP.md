# Appwrite Collections Setup
## Resources Collection

Create collection: `resources` in upstream_db

### Attributes:
| Name        | Type    | Size | Required | Default |
|-------------|---------|------|----------|---------|
| title       | String  | 200  | Yes      |         |
| type        | String  | 50   | Yes      |         |
| phone       | String  | 20   | No       |         |
| address     | String  | 200  | No       |         |
| zip_code    | String  | 10   | No       |         |
| state       | String  | 2    | No       |         |
| app_type    | String  | 50   | Yes      | first_responder |
| source      | String  | 50   | No       |         |
| external_id | String  | 100  | No       |         |
| active      | Boolean |      | Yes      | true    |
| verified    | Boolean |      | Yes      | false   |
| imported_at | String  | 36   | No       |         |
| file_url    | String  | 500  | No       |         |
| hours       | String  | 100  | No       |         |
| notes       | String  | 500  | No       |         |

### Permissions:
- Read: Role.any()
- Create: Role.any() (for auto-import)
- Update: Role.team("admins")
- Delete: Role.team("admins")

### Indexes:
- zip_code (for ZIP search)
- state (for state search)
- app_type (for app version filtering)
- verified (for review queue)

## Agencies Collection (if not created yet)

Create collection: `agencies` in upstream_db

### Attributes:
| Name        | Type    | Size | Required |
|-------------|---------|------|----------|
| name        | String  | 100  | Yes      |
| code        | String  | 20   | Yes      |
| region      | String  | 50   | Yes      |
| type        | String  | 30   | Yes      |
| adminName   | String  | 100  | No       |
| adminPhone  | String  | 20   | No       |
| adminEmail  | String  | 100  | No       |
| eapName     | String  | 100  | No       |
| eapPhone    | String  | 20   | No       |
| eapUrl      | String  | 200  | No       |
| active      | Boolean |      | Yes      |
| appType     | String  | 30   | No       |
| logoUrl     | String  | 500  | No       |
| primaryColor| String  | 10   | No       |
| notes       | String  | 500  | No       |
| createdAt   | String  | 36   | No       |

Feature: Steam manifest parser

  Scenario: Parsing a valid manifest
    Given a manifest file "valid_manifest.acf" with valid content
    When I parse the manifest file "valid_manifest.acf"
    Then the game fields should be:
      | field     | value          |
      | appid     | 526870         |
      | name      | Valid Game     |
      | installed | true           |

  Scenario: Parsing a manifest with missing appid
    Given a manifest file "invalid_appid.acf" missing the appid
    When I parse the manifest file "invalid_appid.acf"
    Then it should throw "InvalidAppId"

  Scenario: Parsing a manifest with missing name
    Given a manifest file "invalid_name.acf" missing the name
    When I parse the manifest file "invalid_name.acf"
    Then it should throw "InvalidName"

  Scenario: Parsing a manifest with missing StateFlags
    Given a manifest file "invalid_state.acf" missing the state
    When I parse the manifest file "invalid_state.acf"
    Then it should throw "InvalidState"

  Scenario: Parsing a nonexistent manifest
    When I parse the manifest file "no_manifest.acf"
    Then the game fields should be:
      | field     | value      |
      | appid     | 0          |
      | name      | UNKNOWN    |
      | installed | false      |
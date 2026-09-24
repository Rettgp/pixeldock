Feature: Steam library folders

  Scenario: Library folders from Steam are merged with the configured library
    Given a Steam install at "steam" with library folders "steam, games2"
    And a configured game library "steam/steamapps"
    When the library directories are resolved
    Then the library directories should be "steam/steamapps, games2/steamapps"

  Scenario: Missing library folders are skipped
    Given a Steam install at "steam" with library folders "steam, missing"
    And a configured game library "steam/steamapps"
    When the library directories are resolved
    Then the library directories should be "steam/steamapps"

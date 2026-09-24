Feature: Settings storage

  Scenario: Preferred Monitor returns null when none is stored
    Given the database has no preferred monitor
    When I fetch the preferred monitor
    Then the preferred monitor should be null

  Scenario: Preferred Monitor is stored and retrieved
    Given the database has a preferred monitor "Monitor 1"
    When I fetch the preferred monitor
    Then the preferred monitor should be "Monitor 1"

  Scenario: Preferred Monitor is updated successfully
    Given the database has a preferred monitor "Monitor 1"
    When I update the preferred monitor to "Monitor 2"
    Then the preferred monitor should be "Monitor 2"

  Scenario: Saving Steam paths keeps the preferred monitor
    Given the database has a preferred monitor "Monitor 2"
    When I save only the Steam paths "C:\cache" and "G:\steamapps"
    Then the preferred monitor should be "Monitor 2"
    And the stored Steam paths should be "C:\cache" and "G:\steamapps"

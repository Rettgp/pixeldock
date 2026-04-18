Feature: Game storage

  Scenario: Adding a game successfully
    When I add a game with:
      | id       | game1    |
      | name     | Game One |
      | exe      |          |
      | heroPath |          |
    Then the database should contain the game with id "game1"
  # Scenario: Adding a game fails
  #   Given the database throws on put
  #   When I attempt to add a game with:
  #     | id   | game2      |
  #     | name | Game Two   |
  #     | exe  |            |
  #     | heroPath |        |
  #   Then the operation should fail with message "Failed to add game"

  Scenario: Fetching games returns list
    Given the database has games:
      | id    | name     | exe   | heroPath |
      | game1 | Game One | path1 | hero1    |
      | game2 | Game Two | path2 | hero2    |
    When I fetch games
    Then I should receive:
      | _id   | name     | exe   | heroPath |
      | game1 | Game One | path1 | hero1    |
      | game2 | Game Two | path2 | hero2    |

  Scenario: Fetching games returns empty list
    Given the database has no games
    When I fetch games
    Then I should receive an empty list

  Scenario: Removing a game successfully
    Given the game "game1" exists in the database
    When I remove the game "game1"
    Then the game should be removed successfully
  # Scenario: Remove fails on get
  #   Given the database throws on get for id "game2"
  #   When I remove the game "game2"
  #   Then the operation should return failure for "game2"
  # Scenario: Remove fails on remove
  #   Given the game "game1" exists in the database
  #   And removal of the game will fail
  #   When I remove the game "game1"
  #   Then the operation should return failure for "game1"

  Scenario: Clear all games deletes them
    Given the database contains:
      | id   |
      | doc1 |
      | doc2 |
    When I clear all games
    Then the deleted documents should be:
      | _id  | _deleted |
      | doc1 | true     |
      | doc2 | true     |

  Scenario: Clear all games when no documents exist
    Given the database has no games
    When I clear all games
    Then no bulk delete should occur

  Scenario: Preferred Monitor falls back to the primary monitor when none is stored
    Given the database has no preferred monitor
    When I fetch the preferred monitor
    Then the preferred monitor should fall back to the primary monitor

  Scenario: Preferred Monitor is stored and retrieved
    Given the database has a preferred monitor "Monitor 1"
    When I fetch the preferred monitor
    Then the preferred monitor should be "Monitor 1"

  Scenario: Preferred Monitor is updated successfully
    Given the database has a preferred monitor "Monitor 1"
    When I update the preferred monitor to "Monitor 2"
    Then the preferred monitor should be "Monitor 2"

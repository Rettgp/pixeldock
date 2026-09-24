Feature: Non-Steam shortcuts

  Scenario: Shortcuts are read from every Steam account
    Given a Steam install with shortcuts:
      | account | name       | appid       | hidden |
      | 111     | Beat Saber | -1458478758 | 0      |
      | 111     | Secret     | 12345       | 1      |
      | 222     | Beat Saber | -1458478758 | 0      |
      | 222     | hlvr       | 100         | 0      |
    When the shortcuts are loaded
    Then the result should contain 2 shortcuts
    And shortcut "Beat Saber" should launch "steam://rungameid/12182625506222407680"

  Scenario: Hero artwork prefers the hero image over the wide capsule
    Given a Steam install with shortcuts:
      | account | name  | appid | hidden |
      | 111     | Alpha | 100   | 0      |
      | 111     | Beta  | 200   | 0      |
      | 111     | Gamma | 300   | 0      |
    And grid images "100_hero.png, 100.png, 200.jpg" for account "111"
    When the shortcuts are loaded
    Then shortcut "Alpha" should use artwork "100_hero.png"
    And shortcut "Beta" should use artwork "200.jpg"
    And shortcut "Gamma" should have no artwork

  Scenario: Logos come from the grid folder
    Given a Steam install with shortcuts:
      | account | name  | appid | hidden |
      | 111     | Alpha | 100   | 0      |
      | 111     | Beta  | 200   | 0      |
    And grid images "100_logo.png, 200_hero.jpg" for account "111"
    When the shortcuts are loaded
    Then shortcut "Alpha" should use logo "100_logo.png"
    And shortcut "Beta" should have no logo

  Scenario: Icons can be png or ico files
    Given a Steam install with shortcuts:
      | account | name  | appid | hidden |
      | 111     | Alpha | 100   | 0      |
      | 111     | Beta  | 200   | 0      |
    And grid images "100_icon.ico, 200_logo.png" for account "111"
    When the shortcuts are loaded
    Then shortcut "Alpha" should use icon "100_icon.ico"
    And shortcut "Beta" should have no icon

  Scenario: No Steam install
    When shortcuts are loaded from a missing Steam folder
    Then the result should contain 0 shortcuts

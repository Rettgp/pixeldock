Feature: Binary VDF parser

  Scenario: Parsing a shortcuts file
    Given a binary shortcuts file with a shortcut named "Beat Saber" and appid -1458478758
    When I parse the binary file
    Then shortcut "0" should have "AppName" equal to "Beat Saber"
    And shortcut "0" should have unsigned appid 2836488538

  Scenario: Key lookup ignores case
    Given a binary shortcuts file with a shortcut named "Old Game" and appid 42
    When I parse the binary file
    Then shortcut "0" should have "appname" equal to "Old Game"

  Scenario: Truncated data is rejected
    Given a truncated binary file
    When I parse the binary file
    Then parsing should throw "InvalidBinaryVdf"

export const GqlConstants = {
  NEW_GAME: `
    mutation newGame($game: game_name_enum = sit_stand_achieve) {
        insert_game_one(object: { game: $game }) {
            id
        }
    }
  `,
  UPDATE_GAME: `
    mutation UpdateGame($id: uuid!, $game: game_set_input = {}) {
        update_game_by_pk(pk_columns: { id: $id }, _set: $game) {
            id
        }
    }
`,
  UPDATE_ANALYTICS: `
    mutation UpdateAnalytics($analytics: jsonb!, $gameId: uuid!) {
        update_game_by_pk(pk_columns: { id: $gameId }, _append: { analytics: $analytics }) {
            id
        }
    }
`,
  UPDATE_REWARDS: `
    mutation UpdateRewards($startDate: String!, $endDate: String!, $userTimezone: String!) {
        updateRewards(startDate: $startDate, endDate: $endDate, userTimezone: $userTimezone) {
            status
        }
    }
`,
  GAME_COMPLETED: `
    mutation GameCompleted($startDate: String!, $endDate: String!, $currentDate: String!, $userTimezone: String!) {
        gameCompleted(startDate: $startDate, endDate: $endDate, currentDate: $currentDate, userTimezone: $userTimezone) {
            status
        }
    }
`,
  GET_CHECKIN_DATA: `
  query GetCheckinData {
    genre: checkin(
      limit: 1
      order_by: { createdAt: desc }
      where: { type: { _eq: genre } }
    ) {
      type
      value
    }
  }
`,
  GET_ONBOARDING_STATUS: `
  query GetOnboardingStatus {
    patient {
      onboardingStatus
    }
  }
`,
  UPDATE_ONBOARDING_STATUS: `
  mutation updateOnboardingStatus($onboardingStatus: jsonb!, $id: uuid!) {
    update_patient(
      where: { id: { _eq: $id } }
      _append: { onboardingStatus: $onboardingStatus }
    ) {
      returning {
        onboardingStatus
      }
    }
  }
`,
  GET_BENCHMARK_CONFIG: `
  query GetBenchmarkConfig($id: uuid = "") {
    game_benchmark_config_by_pk(id: $id) {
      originalGameId
      rawVideoUrl
    }
  }
`,
  SAVE_AUTO_BENCHMARK: `
  mutation SaveAutoBenchmark(
    $analytics: jsonb!
    $gameId: uuid!
    $systemSpec: jsonb = {}
    $originalGameId: uuid = ""
  ) {
    insert_game_benchmarks_one(
      object: {
        analytics: $analytics
        gameId: $gameId
        systemSpec: $systemSpec
        originalGameId: $originalGameId
      }
    ) {
      id
    }
  }
`,
  GET_GAME_SETTINGS: `
  query GetGameSettings($gameName: game_name_enum!) {
    game_settings(where: { gameName: { _eq: $gameName } }) {
      gameName
      createdAt
      updatedAt
      settings: configuration
    }
  }
`,
  UPDATE_GAME_SETTINGS: `
  mutation UpdateGameSettings($gameName: game_name_enum!, $configuration: jsonb!) {
    update_game_settings(
      where: { gameName: { _eq: $gameName } }
      _set: { configuration: $configuration }
    ) {
      affected_rows
    }
  }
`,
  INSERT_GAME_SETTINGS: `
  mutation InsertGameSettings(
    $gameName: game_name_enum = beat_boxer
    $configuration: jsonb = ""
  ) {
    insert_game_settings(objects: { gameName: $gameName, configuration: $configuration }) {
      affected_rows
    }
  }
`,
  GET_LAST_GAME: `
  query GetLastGame($today: timestamptz = "") {
    game(limit: 1, order_by: { endedAt: desc }, where: { endedAt: { _gte: $today } }) {
      id
      game
    }
  }
`,
  GET_LAST_PLAYED_GAME: `
  query GetLastGame($today: timestamptz = "") {
    game(limit: 1, order_by: { createdAt: desc }, where: { createdAt: { _gte: $today } }) {
      id
      game
      endedAt
    }
  }
`,
  GET_BENCHMARK_GAME: `
  query GetBenchmarkGame($id: uuid = "") {
    game_by_pk(id: $id) {
      analytics
      game
      id
    }
  }
`,
  GET_FASTEST_TIME: `
  query GetFastestTime($game: game_name_enum = sit_stand_achieve) {
    game(
      limit: 1
      order_by: { totalDuration: asc_nulls_last }
      where: { endedAt: { _is_null: false }, _and: { game: { _eq: $game } } }
    ) {
      id
      totalDuration
    }
  }
`,
  GET_HIGHSCORE: `
    query GetHighScore($game: game_name_enum = beat_boxer) {
      game(
        limit: 1
        order_by: { repsCompleted: desc_nulls_last }
        where: { endedAt: { _is_null: false }, _and: { game: { _eq: $game } } }
      ) {
        id
        repsCompleted
      }
    }
`,
  GET_ORGANIZATION_CONFIG: `
  query OrganizationConfig($name: String = "") {
    organization(where: {name: {_eq: $name}}) {
      configuration
      logoUrl
    }
  }
`,
};

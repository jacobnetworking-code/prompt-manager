# Prompt Manager M1.7.11.1

Fixes Library Platform → Model filter semantics.

- Reset state displays only `Platform` and `Model`.
- No visible `Any` option.
- Selecting a Platform persists its name in the button.
- Model options are derived only from prompts compatible with the selected Platform.
- Selecting a Model persists its name in the button.
- Changing Platform resets Model when the selected Model is not compatible.
- Platform/Model/category/origin/search are ephemeral and reset on sign-out and fresh app launch.
- No database migration.

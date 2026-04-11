import { InlineKeyboard } from 'grammy';

export function dashboardKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('📊 Dashboard', 'dashboard')
    .text('💰 Positions', 'positions')
    .row()
    .text('📉 History', 'history')
    .text('📈 Market', 'market')
    .row()
    .text('💸 Trades', 'trades')
    .text('📋 Status', 'status')
    .row()
    .text('🤖 Bot Control', 'bot')
    .text('🔔 Notify', 'notify');
}

export function navigationKeyboard(currentAction: string): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  if (currentAction !== 'dashboard') {
    keyboard.text('🔄 Refresh', currentAction);
  }

  if (currentAction !== 'dashboard') {
    keyboard.text('📊 Dashboard', 'dashboard');
  } else {
    keyboard.text('🔄 Refresh', 'dashboard');
    keyboard.text('💰 Positions', 'positions');
    keyboard.row()
      .text('📉 History', 'history')
      .text('📈 Market', 'market');
  }

  return keyboard;
}

export function detailKeyboard(action: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('🔄 Refresh', action)
    .text('📊 Dashboard', 'dashboard');
}

export function botControlKeyboard(isRunning: boolean): InlineKeyboard {
  return new InlineKeyboard()
    .text(isRunning ? '⛔ Stop Bot' : '▶️ Start Bot', isRunning ? 'stop_bot' : 'start_bot')
    .row()
    .text('📊 Dashboard', 'dashboard');
}

export function notifyKeyboard(isEnabled: boolean): InlineKeyboard {
  return new InlineKeyboard()
    .text(isEnabled ? '🔕 Disable' : '🔔 Enable', isEnabled ? 'disable_updates' : 'enable_updates')
    .row()
    .text('📊 Dashboard', 'dashboard');
}
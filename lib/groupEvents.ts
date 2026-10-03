// Evento de janela para avisar componentes (ex.: Sidebar) que a lista de grupos mudou.
export const GROUPS_CHANGED_EVENT = "controle:groups-changed";

export function notifyGroupsChanged() {
  window.dispatchEvent(new Event(GROUPS_CHANGED_EVENT));
}

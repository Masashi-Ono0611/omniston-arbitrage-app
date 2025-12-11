import { Observable, Subject } from "rxjs";

import type { IApiClient } from "./ApiClient.types";
import type {
  ConnectionStatus,
  ConnectionStatusEvent,
} from "./ConnectionStatus";

export class FakeApiClient implements IApiClient {
  public connectionStatus: ConnectionStatus = "ready";
  public readonly connectionStatusEvents = new Subject<ConnectionStatusEvent>();

  async send(_method: string, _payload: unknown): Promise<unknown> {
    return {};
  }

  readStream(_method: string, _subscriptionId: number): Observable<unknown> {
    return new Observable();
  }

  async unsubscribeFromStream(
    method: string,
    subscriptionId: number,
  ): Promise<unknown> {
    return await this.send(method, [subscriptionId]);
  }

  close() {}
}

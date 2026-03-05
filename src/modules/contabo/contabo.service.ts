import { Injectable, HttpException } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class ContaboService {
  private apiUrl = process.env.CONTABO_API_URL;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly apiUser: string;
  private readonly apiPassword: string;

  constructor() {
    if (
      !process.env.CONTABO_CLIENT_ID ||
      !process.env.CONTABO_CLIENT_SECRET ||
      !process.env.CONTABO_API_USER ||
      !process.env.CONTABO_API_PASSWORD
    ) {
      throw new Error(
        "Contabo credentials are not defined in environment variables",
      );
    }

    this.clientId = process.env.CONTABO_CLIENT_ID;
    this.clientSecret = process.env.CONTABO_CLIENT_SECRET;
    this.apiUser = process.env.CONTABO_API_USER;
    this.apiPassword = process.env.CONTABO_API_PASSWORD;
  }

  async getAccessToken(): Promise<string> {
    const params = new URLSearchParams();

    params.append("grant_type", "password");
    params.append("client_id", this.clientId);
    params.append("client_secret", this.clientSecret);
    params.append("username", this.apiUser);
    params.append("password", this.apiPassword);

    const response = await axios.post(
      "https://auth.contabo.com/auth/realms/contabo/protocol/openid-connect/token",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    return response.data.access_token;
  }

  async createInstance(planId: string, region: string) {
    const token = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${this.apiUrl}/compute/instances`,
        {
          productId: planId,
          region,
          imageId: "ubuntu-22-04",
          displayName: `vps-${Date.now()}`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data || "Error creando VPS en Contabo",
        500,
      );
    }
  }

  async getInstance(instanceId: string) {
    const token = await this.getAccessToken();

    const response = await axios.get(
      `${this.apiUrl}/compute/instances/${instanceId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    return response.data;
  }

  async restartInstance(instanceId: string) {
    const token = await this.getAccessToken();

    return axios.post(
      `${this.apiUrl}/compute/instances/${instanceId}/actions/restart`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  }

  async deleteInstance(instanceId: string) {
    const token = await this.getAccessToken();

    return axios.delete(`${this.apiUrl}/compute/instances/${instanceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  async getProducts() {
    const token = await this.getAccessToken();

    const response = await axios.get(`${this.apiUrl}/compute/instances`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.data;
  }
}

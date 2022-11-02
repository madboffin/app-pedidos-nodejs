import {AuthenticationStrategy} from '@loopback/authentication';
import {service} from '@loopback/core';
import {HttpErrors, Request} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import parseBearerToken from 'parse-bearer-token';
import {AuthenticationService} from '../services';

export class StrategyAdministrator implements AuthenticationStrategy {
  name: string = 'admin';
  constructor(
    @service(AuthenticationService)
    public authenticationService: AuthenticationService
  ) { }

  async authenticate(request: Request): Promise<UserProfile | undefined> {

    // ?? como funciona, hay un campo token en el header??
    let token = parseBearerToken(request);
    if (!token) throw new HttpErrors[401]("No hay un token asociado a la peticion");

    let datos = this.authenticationService.validarTokenJWT(token);
    if (!datos) throw new HttpErrors[401]("El token de la peticion no es valido");

    // ?? cuando es 'datos' un string??
    console.log(datos);
    if (typeof datos === 'object') {
      if ('data' in datos) {
        let desencriptado = this.authenticationService.desencriptarObjeto(datos.data);
        console.log(desencriptado);
      }
    }

    // ?? estos datos como los podemos observar despues??
    let perfil: UserProfile = Object.assign({
      data: datos
    });
    return perfil;
  }
}

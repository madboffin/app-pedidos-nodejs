import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import sgMail from '@sendgrid/mail';
import CryptoJS from 'crypto-js';
import jwt from 'jsonwebtoken';
import passwordGenerator from 'password-generator';
import twilio from 'twilio';
import {environment} from '../config/environments';
import {Persona} from '../models';
import {PersonaRepository} from '../repositories';
// const sgMail = require('@sendgrid/mail')
@injectable({scope: BindingScope.TRANSIENT})
export class AuthenticationService {

  secretkey = environment.secretKeyAES;
  accountSid = environment.TWILIO_ACCOUNT_SID;
  authToken = environment.TWILIO_AUTH_TOKEN;
  client = twilio(this.accountSid, this.authToken);


  constructor(
    @repository(PersonaRepository)
    public personaRepository: PersonaRepository
  ) { }

  generarPassword() {
    return passwordGenerator(12, false);
  }

  encriptar(password: string) {
    let encryptedData = CryptoJS.AES.encrypt(password, this.secretkey).toString();
    return encryptedData;
  }

  encriptarObjeto(data: any) {
    let encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), this.secretkey).toString();
    return encryptedData;
  }

  desencriptar(password: string) {
    let bytes = CryptoJS.AES.decrypt(password, this.secretkey);
    let decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    return decryptedData;
  }

  desencriptarObjeto(data: string) {
    let bytes = CryptoJS.AES.decrypt(data, this.secretkey);
    let encryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return encryptedData;
  }

  login(correo: string, password: string) {

    try {
      let persona = this.personaRepository.findOne({
        where: {correo: correo, clave: password}
      });
      if (persona != null) {
        return persona;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  async loginAsync(correo: string, password: string) {
    try {
      let persona = await this.personaRepository.findOne({
        where: {correo: correo}
      });

      if (persona != null) {
        let descencriptado = this.desencriptar(persona.clave);
        if (descencriptado == password) {
          return persona;
        } else {
          return false;
        }
      } else {return false}
    } catch (error) {

    }
  }

  async loginPromesa(correo: string, password: string) {
    let persona = this.personaRepository.findOne({
      where: {correo: correo}
    });

    persona.then(result => {
      console.log("promesa  cumplida");
    }).catch(error => console.log("La promesa no se cumplio por un error"));

    // ?? si se puede hacer este tipo de login??
    // if (persona != null) {
    //   let descencriptado = this.desencriptar(persona.clave);
    //   if (desencriptado == password) {
    //     return persona;
    //   }
    // }
    return false;
  }
  generateTokenJWT(persona: Persona) {
    let token = jwt.sign({
      nombres: persona.nombres,
      apellidos: persona.apellidos,
      id: persona.id
    }, this.secretkey, {expiresIn: 60}
    );
    return token;
  }

  generateTokenJWTObject(persona: Persona) {
    let datos = {
      nombre: persona.nombres,
      apellido: persona.apellidos,
      id: persona.id
    }

    let token = jwt.sign({
      data: this.encriptarObjeto(datos)
    }, this.secretkey, {expiresIn: 5 * 60}
    );
    return token;
  }

  validarTokenJWT(token: string) {
    try {
      let valido = jwt.verify(token, this.secretkey)
      return valido;
    }
    catch {
      return false;
    }
  }

  enviarSMS(mensaje: string, numeroDestino: string): void {

    this.client.messages
      .create({
        body: mensaje,
        from: environment.TWILIO_PNUMBER,
        to: numeroDestino
      })
      .then((message: any) => {
        console.log(message.sid);
        return message.sid;
      });
  }

  enviarCorreo(to: string, subject: string, message: string,): boolean {

    sgMail.setApiKey(environment.SENDGRID_API_KEY)
    const msg = {
      to: to, // Change to your recipient
      from: environment.senderSendGrid, // Change to your verified sender
      subject: subject,
      text: message,
      html: message
    }
    sgMail
      .send(msg)
      .then(() => {
        console.log('Email sent')
      })
      .catch((error: any) => {
        console.error(error)
      })
    return false;
  }
}

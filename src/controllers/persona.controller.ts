import {authenticate} from '@loopback/authentication';
import {service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  del, get,
  getModelSchemaRef, HttpErrors, param, patch, post, put, requestBody,
  response
} from '@loopback/rest';
import {environment} from '../config/environments';
import {Persona, Usuario} from '../models';
import {PersonaRepository} from '../repositories';
import {AuthenticationService} from '../services';

export class PersonaController {
  constructor(
    @repository(PersonaRepository)
    public personaRepository: PersonaRepository,
    @service(AuthenticationService)
    public authenticationService: AuthenticationService,
  ) { }

  @post('/login')
  @response(200, {
    description: 'El usuario ha ingresado con exito'
  })
  async login(
    @requestBody() usuario: Usuario
  ) {
    // version 1.0, funciona si no se encriptaran los datos
    // let persona = await this.authenticationService.login(usuario.correo, usuario.password);

    // version 2.0
    let persona = await this.authenticationService.loginAsync(usuario.correo, usuario.password);
    if (!persona) throw new HttpErrors[401]('Los datos ingresados no son validos');

    let token = this.authenticationService.generateTokenJWTObject(persona);
    // this.authenticationService.enviarSMS(`Se ha logueado con exito:\n ${persona.correo}`, environment.TEST_PNUMBER);

    let message = `
                  <h3>Bienvenido ${persona.nombres} ${persona.apellidos} a la app </h3>
                  <p>Prueba de sengrid</p>
                  <p>Vas a recibir mensajes a ${persona.celular}</p>
                  <p>Vas a recibir correos a ${persona.correo}</p>
                  <img str="https://es.wikipedia.org/wiki/Wikipedia:Portada#/media/Archivo:La_campi%C3%B1a_romana,1639,_Claude_Lorrain.jpg">
                  `;
    this.authenticationService.enviarCorreo(environment.TEST_MAIL, 'Test correo de proyecto', message);

    return {
      data: persona,
      status: 'ok',
      token: token
    };
  }

  @post('/personas')
  @response(200, {
    description: 'Persona model instance',
    content: {'application/json': {schema: getModelSchemaRef(Persona)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Persona, {
            title: 'NewPersona',
            exclude: ['id'],
          }),
        },
      },
    })
    persona: Omit<Persona, 'id'>,
  ): Promise<Persona> {

    // Encriptar clave
    persona.clave = this.authenticationService.encriptar(persona.clave);

    // Mensaje de bienvenida SMS
    let mensaje = `Bienvenido ${persona.nombres} a tu app`
    let numeroCel = `+57${persona.celular}`
    this.authenticationService.enviarSMS(mensaje, numeroCel);

    return this.personaRepository.create(persona);
  }

  @authenticate('admin')
  @get('/personas/count')
  @response(200, {
    description: 'Persona model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Persona) where?: Where<Persona>,
  ): Promise<Count> {
    return this.personaRepository.count(where);
  }

  @get('/personas')
  @response(200, {
    description: 'Array of Persona model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Persona, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Persona) filter?: Filter<Persona>,
  ): Promise<Persona[]> {
    return this.personaRepository.find(filter);
  }

  @patch('/personas')
  @response(200, {
    description: 'Persona PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Persona, {partial: true}),
        },
      },
    })
    persona: Persona,
    @param.where(Persona) where?: Where<Persona>,
  ): Promise<Count> {
    return this.personaRepository.updateAll(persona, where);
  }

  @get('/personas/{id}')
  @response(200, {
    description: 'Persona model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Persona, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Persona, {exclude: 'where'}) filter?: FilterExcludingWhere<Persona>
  ): Promise<Persona> {
    return this.personaRepository.findById(id, filter);
  }

  @patch('/personas/{id}')
  @response(204, {
    description: 'Persona PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Persona, {partial: true}),
        },
      },
    })
    persona: Persona,
  ): Promise<void> {
    await this.personaRepository.updateById(id, persona);
  }

  @put('/personas/{id}')
  @response(204, {
    description: 'Persona PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() persona: Persona,
  ): Promise<void> {
    await this.personaRepository.replaceById(id, persona);
  }

  @del('/personas/{id}')
  @response(204, {
    description: 'Persona DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.personaRepository.deleteById(id);
  }
}

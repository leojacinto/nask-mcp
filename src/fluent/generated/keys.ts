import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    bom_json: {
                        table: 'sys_module'
                        id: '5704875fd0ad48448bb2fd2d09202e1f'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: '89a2500db7fa478eba9e8f9a24a4da60'
                    }
                }
                composite: [
                    {
                        table: 'sys_security_acl_role'
                        id: '07c199ddcb7e4a5fb6bbcd479076cd12'
                        key: {
                            sys_security_acl: 'f745bb0264b142f78aadd4870532fbc4'
                            sys_user_role: {
                                id: '282bf1fac6112285017366cb5f867469'
                                key: {
                                    name: 'itil'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '07fe341a3b505f10a0db3141a3e45aa4'
                        key: {
                            sys_security_acl: '4bfe341a3b505f10a0db3141a3e45a9f'
                            sys_user_role: {
                                id: '7fcaa702933002009c8579b4f47ffbde'
                                key: {
                                    name: 'snc_internal'
                                }
                            }
                        }
                    },
                    {
                        table: 'sn_nowassist_skill_config'
                        id: '128c4f10467c4f67b70e7c8f782dfff3'
                        key: {
                            skill_id: 'd80b56f9fe27426084819e4c10561f02'
                        }
                    },
                    {
                        table: 'sys_gen_ai_strategy_mapping'
                        id: '15fdf18457be456db4aeb0397a0ed358'
                        key: {
                            strategy: 'CAPABILITY_EXECUTION'
                            feature: '99d0ed5a8f6e45c08be38519a74f9c50'
                        }
                    },
                    {
                        table: 'sn_nowassist_skill_config_status'
                        id: '2a541080e20846b691a44439032c8d4d'
                        key: {
                            skill_config: '128c4f10467c4f67b70e7c8f782dfff3'
                        }
                    },
                    {
                        table: 'sys_agent_access_role_configuration'
                        id: '2c350385590e47e9bb91323f6add1efe'
                        key: {
                            agent: '128c4f10467c4f67b70e7c8f782dfff3'
                        }
                    },
                    {
                        table: 'sys_agent_access_role_mapping'
                        id: '33cbe249b9684738a6d730a1d1240584'
                        key: {
                            agent_access_config: '2c350385590e47e9bb91323f6add1efe'
                            role: {
                                id: '282bf1fac6112285017366cb5f867469'
                                key: {
                                    name: 'itil'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_agent_access_role_mapping'
                        id: '43c0b8027b0540b3928f3159794b8cb4'
                        key: {
                            agent_access_config: '2c350385590e47e9bb91323f6add1efe'
                            role: {
                                id: '2831a114c611228501d4ea6c309d626d'
                                key: {
                                    name: 'admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_one_extend_resource_mapping'
                        id: '4ba0c3f2be984e38ba658f87eeed97ea'
                        key: {
                            parent_capability: 'd80b56f9fe27426084819e4c10561f02'
                            resource_capability: 'd80b56f9fe27426084819e4c10561f02'
                        }
                    },
                    {
                        table: 'sys_generative_ai_prompt_config'
                        id: '64342e603f61472fa70476a4af42d144'
                        key: {
                            ai_config: '2e46b3e2170f47508f828856f85b6cf5'
                        }
                    },
                    {
                        table: 'sys_generative_ai_prompt_config'
                        id: '6c12e1cd7da64781a0b27fe2f4bd16b8'
                        key: {
                            ai_config: '4ee34a6fce4a412485dcec0cb3b89a1c'
                        }
                    },
                    {
                        table: 'sys_gen_ai_feature_mapping'
                        id: '99d0ed5a8f6e45c08be38519a74f9c50'
                        key: {
                            feature_name: 'LF CR Summary Fluent'
                            document: 'd80b56f9fe27426084819e4c10561f02'
                        }
                    },
                    {
                        table: 'sys_one_extend_capability_definition'
                        id: 'a414b47dc5f64b4bb9c9b5baab943450'
                        key: {
                            capability: 'd80b56f9fe27426084819e4c10561f02'
                            api: 'a55c1c6f530221106b38ddeeff7b12b1'
                        }
                    },
                    {
                        table: 'sys_generative_ai_prompt_config'
                        id: 'e409dafdfdf24a2d8abe281a74acd595'
                        key: {
                            ai_config: 'e5a75295f3aa4333b65110f7876db7db'
                        }
                    },
                    {
                        table: 'sys_one_extend_definition_config'
                        id: 'ed473445cc5c4e15b2ed5fe2e5a8a6f6'
                        key: {
                            definition: 'a414b47dc5f64b4bb9c9b5baab943450'
                            capability: 'd80b56f9fe27426084819e4c10561f02'
                        }
                    },
                    {
                        table: 'sys_generative_ai_prompt_config'
                        id: 'fd9bdc0137b948688baefe1fb6cb7671'
                        key: {
                            ai_config: '68a7794274094041a63d2da2e141e300'
                        }
                    },
                ]
            }
        }
    }
}

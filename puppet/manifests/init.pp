class basic {

  exec {"apt-get-update":
    command => "/usr/bin/apt-get update --fix-missing"
  }

  package { "curl":
    ensure => installed
  }

}

include basic
include riak_precise64





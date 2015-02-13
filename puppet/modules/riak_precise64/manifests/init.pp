class riak_precise64 {
  group { "puppet":
    ensure => "present"
  }

  package { "libssl0.9.8":
    ensure => installed
  }

  file { "/tmp/downloads":
    ensure => directory,
    group => "puppet"
  }

  exec { "wget-riak":
    command => "/usr/bin/wget http://s3.amazonaws.com/downloads.basho.com/riak/1.4/1.4.8/ubuntu/precise/riak_1.4.8-1_amd64.deb -O /tmp/downloads/riak_1.4.8-1_amd64.deb",
    creates => "/tmp/downloads/riak_1.4.8-1_amd64.deb",
    subscribe => File['/tmp/downloads']
  }

  exec { "riak-install":
    command => "/usr/bin/dpkg -i /tmp/downloads/riak_1.4.8-1_amd64.deb",
    user => root,
    subscribe => Exec["wget-riak"]
  }


  file { "/etc/riak/app.config":
    ensure => present,
    owner => root,
    group => root,
    source => "puppet:///modules/riak_precise64/app.config",
    subscribe => Exec["riak-install"]
  }

  file { "/etc/default/riak":
    ensure => present,
    owner => root,
    group => root,
    source => "puppet:///modules/riak_precise64/default",
    subscribe => File["/etc/riak/app.config"]
  }

  service { "riak":
    ensure => running,
    subscribe => File["/etc/default/riak"]
  }

  exec { "rekon-install":
    command => "/usr/bin/curl -s -L https://raw.githubusercontent.com/basho/rekon/master/download.sh | /bin/sh",
    user => root,
    require => Service["riak"]
  }
}

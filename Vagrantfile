Vagrant.configure("2") do |config|
  config.vm.box = "precise64"
  config.vm.box_url = "http://files.vagrantup.com/precise64.box"

  # Forward Riak port
  config.vm.network :forwarded_port, guest: 8098, host: 8098
  config.vm.network :forwarded_port, guest: 8087, host: 8087

  # Provision with Puppet
  config.vm.provision :puppet, module_path: "puppet/modules" do |puppet|
    puppet.manifests_path = "puppet/manifests"
    puppet.manifest_file = "init.pp"
  end
end


const tableElem = document.getElementById("table-body");
const candidateOptions = document.getElementById("candidate-options");
const voteForm = document.getElementById("vote-form");

var proposals = [];
var myAddress;
var eleicao;
const CONTRACT_ADDRESS = "0x2515875fa612309A1C41142BAE0a0dd6DB1B4Fa7";


const ethEnabled = () => {
	if (window.ethereum) {
    		window.web3 = new Web3(window.ethereum);
    		window.ethereum.enable();
    		return true;
  	}
  	return false;
}

const getMyAccounts = accounts => {
	try {
		if (accounts.length == 0) {
			alert("Você não tem contas habilitadas no Metamask!");
		} else {
			myAddress = accounts[0];
			accounts.forEach(async myAddress => {
				console.log(myAddress + " : " + await window.web3.eth.getBalance(myAddress));
			});
		}
	} catch(error) {
		console.log("Erro ao obter contas...");
	}
};

window.addEventListener('load', async function() {

	if (!ethEnabled()) {
  		alert("Por favor, instale um navegador compatível com Ethereum ou uma extensão como o MetaMask para utilizar esse dApp!");
	}
	else {
		getMyAccounts(await web3.eth.getAccounts());

		eleicao = new web3.eth.Contract(VotingContractInterface, CONTRACT_ADDRESS);
		getCandidatos(populaCandidatos);
		getEleitores()
		verificarEncerramento();
		$("#nrContrato").text(CONTRACT_ADDRESS)
	}
});

function verificarEncerramento() {
	eleicao.methods.finalizado().call().then((encerrado) => {
		if (!encerrado) return;

		eleicao.methods.winnerName().call().then((vencedor) => {
			exibirEncerramento(vencedor)
		})
	}).catch(err => {
		console.error(err);
		alert('Erro! Verifique o log')
	})
}

function getCandidatos(callback)
{
	eleicao.methods.getProposalsCount().call(async function (error, count) {
		proposals = [];
		for (i=0; i<count; i++) {
			await eleicao.methods.getProposal(i).call().then((data)=>{
				var proposal = {
          				name : data.name,
          				voteCount : data.voteCount
      				};
				proposals.push(proposal);
 			});
		}
		if (callback) {
			callback(proposals);
		}

	});
}

function populaCandidatos(candidatos) {
	while(tableElem.rows.length > 0) {
		tableElem.deleteRow(0);
	}
	$("#candidate-options option").remove();
	candidatos.forEach((candidato, index) => {
		// Creates a row element.
		const rowElem = document.createElement("tr");

		// Creates a cell element for the name.
		const nameCell = document.createElement("td");
		nameCell.innerText = candidato.name;
		rowElem.appendChild(nameCell);

		// Creates a cell element for the votes.
		const voteCell = document.createElement("td");
		voteCell.id = "vote-" + candidato.name; 
		voteCell.innerText = candidato.voteCount;
		rowElem.appendChild(voteCell);

		// Adds the new row to the voting table.
		tableElem.appendChild(rowElem);

		// Creates an option for each candidate
		const candidateOption = document.createElement("option");
		candidateOption.value = index;
		candidateOption.innerText = candidato.name;
		candidateOptions.appendChild(candidateOption);
	});
}

function populaEleitores(eleitores) {
	$("#body-eleitores tr").remove();
	eleitores.forEach(eleitor => {
		const row = document.createElement('tr');
		const nameCell = document.createElement('td');
		const votedCell = document.createElement('td');
		const delegateCell = document.createElement('td');
		nameCell.innerText = eleitor.name;
		votedCell.innerText = eleitor.voted ? 'Sim' : 'Não';
		delegateCell.innerText = eleitor.delegate && eleitor.delegate != '0x0000000000000000000000000000000000000000' ? 'Sim' : 'Não';
		row.appendChild(nameCell)
		row.appendChild(votedCell)
		row.appendChild(delegateCell)
		$("#body-eleitores").append(row)
	})
}

function getEleitores() {
	eleicao.methods.retornarEleitores().call().then(result => {
		populaEleitores(result)
	}).catch(err => {
		console.error(err)
		alert('Erro ao buscar eleitores! Consulte o log')
	})
}

function exibirEncerramento(nomeVencedor) {
	$("#secao-encerramento").css({ display: "block"})
	$("#nome-vencedor").text(nomeVencedor)
}

const toObject = (array) => array.reduce((prev, cur) => {
	prev[cur.name] = cur.value;
	return prev
}, {})

$("#give-right-form").submit(function(e) {
	e.preventDefault();
	const data = toObject($("#give-right-form").serializeArray())
	console.log(data)
	eleicao.methods.giveRightToVote(data.address, data.name)
	.send({from: myAddress})
	.then(() => getEleitores())
	.catch((error) => {
		console.error(error)
		alert('Erro! Consulte o log!')
	})
});

$("#add-candidate-form").submit((e) => {
	e.preventDefault();
	const data = toObject($("#add-candidate-form").serializeArray())
	console.log(data)
	eleicao.methods.addProposal(data.name)
	.send({from: myAddress})
	.then(() => getCandidatos(populaCandidatos))
	.catch((error) => {
		console.error(error)
		alert('Erro! Consulte o log!')
	})
})

$("#delegate-form").submit((e) => {
	e.preventDefault();
	const data = toObject($("#delegate-form").serializeArray())
	console.log(data)
	eleicao.methods.delegate(data.address)
	.send({from: myAddress})
	.then(() => getEleitores())
	.catch((error) => {
		console.error(error)
		alert('Erro! Consulte o log!')
	})
})

$("#btn-finalizar").click(() => {
	eleicao.methods.finalizarEleicao()
	.send({from: myAddress})
	.then(() => exibirEncerramento())
	.catch((error) => {
		console.error(error)
		alert('Erro! Consulte o log!')
	})
})


$("#btnVote").on('click',function(){
	candidato = $("#candidate-options").children("option:selected").val();
	eleicao.methods.vote(candidato).send({from: myAddress})
		.on('receipt',function(receipt) {
			getCandidatos(populaCandidatos)
		})
		.on('error',function(error) {
			console.log(error.message);
		});  

});